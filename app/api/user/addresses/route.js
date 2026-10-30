import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, validateMobile, normalizeMobile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function validatePincode(pincode) {
  if (!pincode || typeof pincode !== 'string') return false;
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefaultDelivery: 'desc' },
        { isDefaultBilling: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Fetch addresses error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      street,
      city,
      state,
      pincode,
      addressType = 'Delivery',
      isDefaultDelivery = false,
      isDefaultBilling = false,
      deliveryInstructions,
    } = body;

    // Validations
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Recipient name is required (min 2 characters)' }, { status: 400 });
    }

    const cleanPhone = normalizeMobile(phone);
    if (!validateMobile(cleanPhone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
    }

    if (!street || street.trim().length < 5) {
      return NextResponse.json({ error: 'Street address / building name is required (min 5 characters)' }, { status: 400 });
    }

    if (!city || city.trim().length < 2) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    if (!state || state.trim().length < 2) {
      return NextResponse.json({ error: 'State / Union Territory is required' }, { status: 400 });
    }

    if (!validatePincode(pincode)) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit Indian PIN code' }, { status: 400 });
    }

    // Check count of existing addresses
    const existingCount = await prisma.address.count({ where: { userId: user.id } });
    const isFirstAddress = existingCount === 0;

    const makeDefaultDelivery = isFirstAddress || Boolean(isDefaultDelivery);
    const makeDefaultBilling = isFirstAddress || Boolean(isDefaultBilling);

    // If making default, reset others
    if (makeDefaultDelivery) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefaultDelivery: false },
      });
    }

    if (makeDefaultBilling) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefaultBilling: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        name: name.trim(),
        phone: cleanPhone,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        addressType: ['Delivery', 'Billing', 'Both'].includes(addressType) ? addressType : 'Delivery',
        isDefaultDelivery: makeDefaultDelivery,
        isDefaultBilling: makeDefaultBilling,
        deliveryInstructions: deliveryInstructions ? deliveryInstructions.trim() : null,
      },
    });

    return NextResponse.json({
      message: 'Address added successfully!',
      address: newAddress,
    }, { status: 201 });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      phone,
      street,
      city,
      state,
      pincode,
      addressType,
      isDefaultDelivery,
      isDefaultBilling,
      deliveryInstructions,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    // Authorization check
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied. You cannot modify another user\'s address.' }, { status: 403 });
    }

    const updateData = {};

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return NextResponse.json({ error: 'Recipient name is required (min 2 characters)' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      const cleanPhone = normalizeMobile(phone);
      if (!validateMobile(cleanPhone)) {
        return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
      }
      updateData.phone = cleanPhone;
    }

    if (street !== undefined) {
      if (street.trim().length < 5) {
        return NextResponse.json({ error: 'Street address is required (min 5 characters)' }, { status: 400 });
      }
      updateData.street = street.trim();
    }

    if (city !== undefined) {
      if (city.trim().length < 2) {
        return NextResponse.json({ error: 'City is required' }, { status: 400 });
      }
      updateData.city = city.trim();
    }

    if (state !== undefined) {
      if (state.trim().length < 2) {
        return NextResponse.json({ error: 'State is required' }, { status: 400 });
      }
      updateData.state = state.trim();
    }

    if (pincode !== undefined) {
      if (!validatePincode(pincode)) {
        return NextResponse.json({ error: 'Valid 6-digit Indian PIN code is required' }, { status: 400 });
      }
      updateData.pincode = pincode.trim();
    }

    if (addressType && ['Delivery', 'Billing', 'Both'].includes(addressType)) {
      updateData.addressType = addressType;
    }

    if (deliveryInstructions !== undefined) {
      updateData.deliveryInstructions = deliveryInstructions ? deliveryInstructions.trim() : null;
    }

    if (isDefaultDelivery === true) {
      await prisma.address.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefaultDelivery: false },
      });
      updateData.isDefaultDelivery = true;
    } else if (isDefaultDelivery === false) {
      updateData.isDefaultDelivery = false;
    }

    if (isDefaultBilling === true) {
      await prisma.address.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefaultBilling: false },
      });
      updateData.isDefaultBilling = true;
    } else if (isDefaultBilling === false) {
      updateData.isDefaultBilling = false;
    }

    const updated = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Address updated successfully!',
      address: updated,
    });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // ignore json parse error if empty body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied. You cannot delete another user\'s address.' }, { status: 403 });
    }

    await prisma.address.delete({
      where: { id },
    });

    // If deleted address was default, make the next available address default
    if (existingAddress.isDefaultDelivery) {
      const nextAddr = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddr) {
        await prisma.address.update({
          where: { id: nextAddr.id },
          data: { isDefaultDelivery: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}


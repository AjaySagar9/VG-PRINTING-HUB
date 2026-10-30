import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const designs = await prisma.savedDesign.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ designs });
  } catch (error) {
    console.error('Fetch saved designs error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved designs' }, { status: 500 });
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
      productId,
      productName,
      designName,
      previewSnapshot,
      artworkUrl,
      placement = 'Front Center',
      customText,
      textColor = '#ffffff',
      scale = 1.0,
      offsetY = 0,
      selectedColor,
      selectedSize,
    } = body;

    if (!designName || designName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter a name for your design (min 2 characters)' },
        { status: 400 }
      );
    }

    if (!productName || !productName.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!previewSnapshot) {
      return NextResponse.json(
        { error: 'A design preview snapshot is required' },
        { status: 400 }
      );
    }

    const newDesign = await prisma.savedDesign.create({
      data: {
        userId: user.id,
        productId: productId || null,
        productName: productName.trim(),
        designName: designName.trim(),
        previewSnapshot,
        artworkUrl: artworkUrl || null,
        placement: placement || 'Front Center',
        customText: customText ? customText.trim() : null,
        textColor: textColor || '#ffffff',
        scale: typeof scale === 'number' ? scale : 1.0,
        offsetY: typeof offsetY === 'number' ? offsetY : 0,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
      },
    });

    return NextResponse.json({
      message: 'Design saved to your account library!',
      design: newDesign,
    }, { status: 201 });
  } catch (error) {
    console.error('Save design error:', error);
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, designName, selectedColor, selectedSize, customText, textColor, scale, offsetY, placement } = body;

    if (!id) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
    }

    const existing = await prisma.savedDesign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Saved design not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. You cannot modify another user\'s design.' },
        { status: 403 }
      );
    }

    const updateData = {};
    if (designName && designName.trim().length >= 2) {
      updateData.designName = designName.trim();
    }
    if (selectedColor !== undefined) updateData.selectedColor = selectedColor;
    if (selectedSize !== undefined) updateData.selectedSize = selectedSize;
    if (customText !== undefined) updateData.customText = customText;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (typeof scale === 'number') updateData.scale = scale;
    if (typeof offsetY === 'number') updateData.offsetY = offsetY;
    if (placement !== undefined) updateData.placement = placement;

    const updated = await prisma.savedDesign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Design updated successfully',
      design: updated,
    });
  } catch (error) {
    console.error('Update design error:', error);
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
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
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
    }

    const existing = await prisma.savedDesign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Saved design not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. You cannot delete another user\'s design.' },
        { status: 403 }
      );
    }

    await prisma.savedDesign.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Saved design removed from your library',
    });
  } catch (error) {
    console.error('Delete design error:', error);
    return NextResponse.json({ error: 'Failed to delete saved design' }, { status: 500 });
  }
}


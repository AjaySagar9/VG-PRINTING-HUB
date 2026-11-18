import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Administrator access required.' },
        { status: 403 }
      );
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error('Admin Products GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products for admin' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Administrator access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      wholesalePrice,
      imageUrl,
      images,
      categoryId,
      moq,
      wholesaleMoq,
      colors,
      disabledColors,
      colorImages,
      sizes,
      placements,
      pricingTiers,
      customizable,
      badge,
      stock,
    } = body;

    if (!name || price == null) {
      return NextResponse.json(
        { error: 'Product name and retail price are required.' },
        { status: 400 }
      );
    }

    const generatedSlug = slug && slug.trim() ? slugify(slug) : slugify(name);

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: generatedSlug,
        description: description || '',
        price: Number(price),
        wholesalePrice: wholesalePrice != null && wholesalePrice !== '' ? Number(wholesalePrice) : null,
        imageUrl: imageUrl || null,
        images: Array.isArray(images) ? images : [],
        categoryId: categoryId || null,
        moq: Number(moq) || 1,
        wholesaleMoq: Number(wholesaleMoq) || 20,
        colors: Array.isArray(colors) ? colors : [],
        disabledColors: Array.isArray(disabledColors) ? disabledColors : [],
        colorImages: typeof colorImages === 'string' ? colorImages : JSON.stringify(colorImages || {}),
        sizes: Array.isArray(sizes) ? sizes : [],
        placements: Array.isArray(placements) ? placements : [],
        pricingTiers: typeof pricingTiers === 'string' ? pricingTiers : JSON.stringify(pricingTiers || []),
        customizable: customizable !== false,
        badge: badge || null,
        stock: Number(stock) || 500,
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Admin Products POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Administrator access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update.' }, { status: 400 });
    }

    const updatePayload = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.slug !== undefined) updatePayload.slug = slugify(data.slug || data.name);
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.price !== undefined) updatePayload.price = Number(data.price);
    if (data.wholesalePrice !== undefined) {
      updatePayload.wholesalePrice = data.wholesalePrice != null && data.wholesalePrice !== '' ? Number(data.wholesalePrice) : null;
    }
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl;
    if (data.images !== undefined) updatePayload.images = Array.isArray(data.images) ? data.images : [];
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId || null;
    if (data.moq !== undefined) updatePayload.moq = Number(data.moq);
    if (data.wholesaleMoq !== undefined) updatePayload.wholesaleMoq = Number(data.wholesaleMoq);
    if (data.colors !== undefined) updatePayload.colors = Array.isArray(data.colors) ? data.colors : [];
    if (data.disabledColors !== undefined) updatePayload.disabledColors = Array.isArray(data.disabledColors) ? data.disabledColors : [];
    if (data.colorImages !== undefined) {
      updatePayload.colorImages = typeof data.colorImages === 'string' ? data.colorImages : JSON.stringify(data.colorImages || {});
    }
    if (data.sizes !== undefined) updatePayload.sizes = Array.isArray(data.sizes) ? data.sizes : [];
    if (data.placements !== undefined) updatePayload.placements = Array.isArray(data.placements) ? data.placements : [];
    if (data.pricingTiers !== undefined) {
      updatePayload.pricingTiers = typeof data.pricingTiers === 'string' ? data.pricingTiers : JSON.stringify(data.pricingTiers || []);
    }
    if (data.customizable !== undefined) updatePayload.customizable = Boolean(data.customizable);
    if (data.badge !== undefined) updatePayload.badge = data.badge || null;
    if (data.stock !== undefined) updatePayload.stock = Number(data.stock);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updatePayload,
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Admin Products PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Administrator access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Admin Products DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}


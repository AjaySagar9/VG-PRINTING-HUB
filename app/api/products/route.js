import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const isApprovedWholesaler = Boolean(
      user &&
      user.role === 'WHOLESALER' &&
      user.approvalStatus === 'APPROVED'
    );

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search') || searchParams.get('q');
    const sort = searchParams.get('sort') || 'featured';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));
    const productId = searchParams.get('id');

    // 1. Single product detail by ID
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const { wholesalePrice, ...retailOnly } = product;
      const sanitized = isApprovedWholesaler
        ? {
            ...product,
            wholesalePrice: wholesalePrice || Math.round(product.price * 0.6),
            canAccessWholesale: true,
          }
        : {
            ...retailOnly,
            canAccessWholesale: false,
          };

      return NextResponse.json({
        product: sanitized,
        viewer: {
          role: user?.role || 'GUEST',
          approvalStatus: user?.approvalStatus || null,
          isApprovedWholesaler,
        }
      });
    }

    // 2. Build where filter
    const where = {};

    if (categorySlug && categorySlug !== 'all') {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // 3. Build orderBy
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [products, totalCount, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true }
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({ orderBy: { name: 'asc' } })
    ]);

    // Sanitize wholesale prices on backend
    const sanitizedProducts = products.map((prod) => {
      const { wholesalePrice, ...retail } = prod;
      if (isApprovedWholesaler) {
        return {
          ...prod,
          wholesalePrice: wholesalePrice || Math.round(prod.price * 0.6),
          wholesaleMinQty: prod.wholesaleMoq || 25,
          wholesaleSavingsPercent: Math.round(((prod.price - (wholesalePrice || Math.round(prod.price * 0.6))) / prod.price) * 100),
          canAccessWholesale: true,
        };
      }
      return {
        ...retail,
        canAccessWholesale: false,
      };
    });

    return NextResponse.json({
      products: sanitizedProducts,
      categories,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      viewer: {
        role: user ? user.role : 'GUEST',
        approvalStatus: user ? user.approvalStatus : null,
        isApprovedWholesaler,
      }
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding expanded e-commerce catalog, categories, products, coupons, and admin...');

  // 1. Admin user
  const adminEmail = 'admin@vgprintinghub.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 10);
    await prisma.user.create({
      data: {
        name: 'VG Hub Administrator',
        email: adminEmail,
        mobile: '9999988888',
        passwordHash,
        role: 'ADMIN',
        approvalStatus: 'APPROVED',
      }
    });
    console.log('Created admin account.');
  }

  // 2. Categories
  const categoriesData = [
    { name: 'T-Shirts', slug: 't-shirts', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80' },
    { name: 'Hoodies & Sweatshirts', slug: 'hoodies', imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80' },
    { name: 'Caps & Headwear', slug: 'caps', imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80' },
    { name: 'Badges & Lanyards', slug: 'badges', imageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&auto=format&fit=crop&q=80' },
    { name: 'Pens & Stationery', slug: 'pens', imageUrl: 'https://images.unsplash.com/photo-1585336261026-78b1d9bf16c3?w=600&auto=format&fit=crop&q=80' },
    { name: 'Keychains & Accessories', slug: 'keychains', imageUrl: 'https://images.unsplash.com/photo-1590483259837-1e5f0376d547?w=600&auto=format&fit=crop&q=80' },
    { name: 'Employee Joining Kits', slug: 'employee-joining-kits', imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80' },
    { name: 'Corporate Gifts', slug: 'corporate-gifts', imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80' },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    let existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      existing = await prisma.category.create({ data: cat });
    }
    categoryMap[cat.slug] = existing.id;
  }
  console.log('Categories ready:', Object.keys(categoryMap).length);

  // 3. Delete existing sample products and re-create detailed catalog
  await prisma.product.deleteMany({});

  const productsData = [
    // T-SHIRTS
    {
      name: 'Custom Corporate Bio-Wash T-Shirt',
      slug: 'custom-corporate-bio-wash-tshirt',
      description: '100% premium combed bio-washed 220 GSM cotton t-shirt. Ideal for daily corporate uniforms, promotional campaigns, and college fest branding with high-definition screen, DTF, or vinyl print.',
      price: 499,
      wholesalePrice: 260,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['t-shirts'],
      moq: 1,
      wholesaleMoq: 25,
      rating: 4.9,
      ratingCount: 128,
      discountPercent: 20,
      colors: ['#ffffff', '#1a1a1a', '#1e3a8a', '#991b1b', '#374151', '#047857'],
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      placements: ['Front Chest', 'Back Full', 'Left Chest Pocket', 'Right Sleeve'],
      customizable: true,
      badge: 'Bestseller',
      stock: 1200,
    },
    {
      name: 'Executive Polo Collar Honeycomb T-Shirt',
      slug: 'executive-polo-collar-tshirt',
      description: 'Durable 240 GSM poly-cotton honeycomb knit collar tee with contrast tipping on collar & cuffs. Features anti-pilling and color-fast technology tailored for office wear.',
      price: 699,
      wholesalePrice: 380,
      imageUrl: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1625910513413-5b8d0092c4e1?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['t-shirts'],
      moq: 1,
      wholesaleMoq: 20,
      rating: 4.8,
      ratingCount: 94,
      discountPercent: 15,
      colors: ['#ffffff', '#0f172a', '#1e40af', '#15803d', '#dc2626'],
      sizes: ['M', 'L', 'XL', '2XL'],
      placements: ['Left Chest Embroidery', 'Back Collar', 'Sleeve'],
      customizable: true,
      badge: 'Popular',
      stock: 850,
    },

    // HOODIES
    {
      name: 'Heavyweight Fleece Unisex Pullover Hoodie',
      slug: 'heavyweight-fleece-unisex-hoodie',
      description: '320 GSM brushed fleece inside for ultra softness and winter comfort. Features double-layered hood, kangaroo pocket, and matching drawstrings with metal aglets.',
      price: 1299,
      wholesalePrice: 740,
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['hoodies'],
      moq: 1,
      wholesaleMoq: 15,
      rating: 4.9,
      ratingCount: 76,
      discountPercent: 25,
      colors: ['#1a1a1a', '#374151', '#1e3a8a', '#7f1d1d', '#f3f4f6'],
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      placements: ['Front Center', 'Back Center', 'Left Chest', 'Sleeve Line'],
      customizable: true,
      badge: 'Top Rated',
      stock: 600,
    },

    // CAPS
    {
      name: 'Structured 6-Panel Twill Baseball Cap',
      slug: 'structured-twill-baseball-cap',
      description: 'Heavy brushed cotton twill with pre-curved visor, embroidered eyelets, and adjustable brass buckle closure. Fits all head sizes comfortably.',
      price: 299,
      wholesalePrice: 135,
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['caps'],
      moq: 1,
      wholesaleMoq: 50,
      rating: 4.7,
      ratingCount: 65,
      discountPercent: 15,
      colors: ['#ffffff', '#000000', '#1e3a8a', '#b91c1c', '#f59e0b'],
      sizes: ['Free Size (Adjustable)'],
      placements: ['Front Center', 'Right Side', 'Back Arch'],
      customizable: true,
      badge: 'Trending',
      stock: 1500,
    },

    // BADGES
    {
      name: 'Crystal Acrylic Dual-Magnet Staff ID Badge',
      slug: 'crystal-acrylic-magnet-badge',
      description: '3mm scratch-resistant acrylic with direct UV full-color printing and strong dual-neodymium magnet backplate that prevents pin holes in clothing.',
      price: 149,
      wholesalePrice: 55,
      imageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['badges'],
      moq: 1,
      wholesaleMoq: 50,
      rating: 4.8,
      ratingCount: 110,
      discountPercent: 20,
      colors: ['#ffffff', '#e2e8f0', '#fbbf24'],
      sizes: ['70 x 25 mm', '75 x 30 mm'],
      placements: ['Front Full Face'],
      customizable: true,
      badge: 'Corporate Pick',
      stock: 3000,
    },

    // PENS
    {
      name: 'Laser-Engraved Metal Executive Rollerball Pen',
      slug: 'laser-engraved-metal-pen',
      description: 'Matte metallic finish barrel with chrome accents and high-precision laser brand engraving that never fades. German 0.7mm smooth rollerball black refill.',
      price: 199,
      wholesalePrice: 85,
      imageUrl: 'https://images.unsplash.com/photo-1585336261026-78b1d9bf16c3?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1585336261026-78b1d9bf16c3?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['pens'],
      moq: 1,
      wholesaleMoq: 50,
      rating: 4.8,
      ratingCount: 140,
      discountPercent: 15,
      colors: ['#1a1a1a', '#475569', '#be123c', '#047857', '#ca8a04'],
      sizes: ['Standard Length (138mm)'],
      placements: ['Pen Barrel', 'Pen Cap'],
      customizable: true,
      badge: 'Best Value',
      stock: 5000,
    },

    // KEYCHAINS
    {
      name: 'Laser Engraved Genuine Leather Metal Keychain',
      slug: 'engraved-leather-metal-keychain',
      description: 'Vegetable-tanned full-grain leather strap paired with brushed gunmetal zinc alloy plate, engraved with your custom crest or company identity.',
      price: 179,
      wholesalePrice: 65,
      imageUrl: 'https://images.unsplash.com/photo-1590483259837-1e5f0376d547?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1590483259837-1e5f0376d547?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['keychains'],
      moq: 1,
      wholesaleMoq: 50,
      rating: 4.7,
      ratingCount: 52,
      discountPercent: 10,
      colors: ['#78350f', '#18181b', '#0f766e'],
      sizes: ['Compact (95 x 20 mm)'],
      placements: ['Metal Plate Front', 'Leather Emboss'],
      customizable: true,
      badge: 'New',
      stock: 2200,
    },

    // EMPLOYEE JOINING KITS
    {
      name: 'Executive 5-in-1 Employee Welcome Joining Kit',
      slug: 'executive-5-in-1-employee-joining-kit',
      description: 'Complete onboarding package containing: (1) Custom printed Hardcover Leather Diary, (2) Laser-Engraved Metal Pen, (3) 500ml Smart Temperature Flask, (4) Metal Keychain, (5) Premium Rigid Gift Box with customized company branding on all items.',
      price: 1899,
      wholesalePrice: 1100,
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['employee-joining-kits'],
      moq: 1,
      wholesaleMoq: 10,
      rating: 5.0,
      ratingCount: 88,
      discountPercent: 20,
      colors: ['#0f172a', '#1e3a8a', '#111827'],
      sizes: ['Deluxe Rigid Box Set'],
      placements: ['Box Lid + All Internal Items'],
      customizable: true,
      badge: 'HR Favorite',
      stock: 450,
    },
    {
      name: 'Eco-Friendly Welcome Kit (Jute Bag + Bamboo Pen + Seed Diary)',
      slug: 'eco-friendly-welcome-kit',
      description: 'Sustainable corporate gifting set including natural jute tote bag, 100% biodegradable plantable seed paper notebook, and engraved natural bamboo roller pen.',
      price: 899,
      wholesalePrice: 490,
      imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['employee-joining-kits'],
      moq: 1,
      wholesaleMoq: 20,
      rating: 4.9,
      ratingCount: 64,
      discountPercent: 15,
      colors: ['#d97706', '#15803d', '#ffffff'],
      sizes: ['Standard Eco Kit'],
      placements: ['Tote Bag Front', 'Diary Cover', 'Bamboo Barrel'],
      customizable: true,
      badge: 'Eco-Green',
      stock: 750,
    },

    // CORPORATE GIFTS
    {
      name: 'Smart LED Temperature Vacuum Insulated Flask (500ml)',
      slug: 'smart-led-temperature-insulated-flask',
      description: 'Double-walled SUS304 food-grade stainless steel bottle keeps beverages hot or cold for 24 hours. HD LCD touch temperature display on cap with matte finish branding.',
      price: 599,
      wholesalePrice: 295,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['corporate-gifts'],
      moq: 1,
      wholesaleMoq: 25,
      rating: 4.9,
      ratingCount: 165,
      discountPercent: 25,
      colors: ['#0f172a', '#1e3a8a', '#b91c1c', '#f8fafc', '#ca8a04'],
      sizes: ['500 ml'],
      placements: ['Vertical Front', '360 Wrap Print'],
      customizable: true,
      badge: 'Top Gift',
      stock: 1800,
    },
    {
      name: 'Personalized Glossy Ceramic Coffee Mug (350ml)',
      slug: 'personalized-glossy-ceramic-mug',
      description: 'High-grade non-toxic ceramic with vibrant, scratch-resistant photographic sublimation printing. Safe for microwave and dishwasher usage.',
      price: 299,
      wholesalePrice: 135,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
      ],
      categoryId: categoryMap['corporate-gifts'],
      moq: 1,
      wholesaleMoq: 50,
      rating: 4.8,
      ratingCount: 220,
      discountPercent: 20,
      colors: ['#ffffff', '#000000', '#dc2626', '#2563eb'],
      sizes: ['350 ml (11 oz)'],
      placements: ['Front Center', 'Both Sides', 'Full Panoramic Wrap'],
      customizable: true,
      badge: 'Classic',
      stock: 3500,
    }
  ];

  for (const item of productsData) {
    await prisma.product.create({ data: item });
  }
  console.log(`Successfully seeded ${productsData.length} detailed merchandise products.`);

  // 4. Seed Coupons
  await prisma.coupon.deleteMany({});
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 499, maxDiscount: 300, isActive: true },
      { code: 'BULK50', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 5000, maxDiscount: 2500, isActive: true },
      { code: 'VGFLAT100', discountType: 'FLAT', discountValue: 100, minOrderAmount: 999, maxDiscount: 100, isActive: true }
    ]
  });
  console.log('Seeded active promotional coupons.');

  console.log('--- SEEDING FINISHED SUCCESSFULLY ---');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

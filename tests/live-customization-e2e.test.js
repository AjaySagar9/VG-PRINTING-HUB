/**
 * Live E2E Integration Test for VG Printing Hub:
 * Advanced Customization & Pricing System
 */

async function runLiveE2E() {
  console.log('\n=== RUNNING LIVE E2E INTEGRATION TEST ===\n');
  const BASE_URL = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. Fetch catalog
  let testProduct = null;
  await test('Catalog API returns products with parsedPricingTiers and parsedColorImages', async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    assert(res.ok, `Catalog fetch failed: status ${res.status}`);
    const data = await res.json();
    assert(data.products && data.products.length > 0, 'No products found');
    
    // Find Bio-Wash product with tiers
    const tiered = data.products.find(p => p.name.includes('Bio-Wash'));
    assert(tiered, 'Bio-Wash product not found');
    
    // Fetch single product detail
    const detailRes = await fetch(`${BASE_URL}/api/products?id=${tiered.id}`);
    assert(detailRes.ok, `Detail fetch failed: ${detailRes.status}`);
    const detailData = await detailRes.json();
    testProduct = detailData.product;

    assert(testProduct.parsedPricingTiers, 'parsedPricingTiers missing on product detail');
    assert(testProduct.parsedPricingTiers.length >= 4, 'Expected at least 4 pricing tiers');
    assert(testProduct.parsedColorImages, 'parsedColorImages missing on product detail');
    assert(Array.isArray(testProduct.disabledColors), 'disabledColors should be an array');
  });

  // 2. Upload Artwork (PNG and PDF)
  let uploadedPngUrl = null;
  let uploadedPdfUrl = null;

  await test('Artwork Upload API accepts PNG graphic', async () => {
    const formData = new FormData();
    const fakePng = new Blob(['PNG_SIMULATED_BINARY_DATA'], { type: 'image/png' });
    formData.append('file', fakePng, 'company_logo.png');

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    assert(res.ok, `PNG upload failed: ${res.status}`);
    const data = await res.json();
    assert(data.url && data.url.startsWith('/uploads/'), 'Invalid upload url');
    assert(!data.isPdf, 'PNG should not be marked as PDF');
    uploadedPngUrl = data.url;
  });

  await test('Artwork Upload API accepts PDF vector document', async () => {
    const formData = new FormData();
    const fakePdf = new Blob(['%PDF-1.4 SIMULATED_VECTOR_DOCUMENT'], { type: 'application/pdf' });
    formData.append('file', fakePdf, 'brand_guide.pdf');

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    assert(res.ok, `PDF upload failed: ${res.status}`);
    const data = await res.json();
    assert(data.url && data.url.endsWith('.pdf'), 'Uploaded URL must preserve .pdf');
    assert(data.isPdf === true, 'PDF must be marked with isPdf=true');
    uploadedPdfUrl = data.url;
  });

  // 3. Cart Quote Calculations
  await test('Cart Quote API calculates Tier 1 (1-9 pcs) retail pricing', async () => {
    const res = await fetch(`${BASE_URL}/api/cart/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          productId: testProduct.id,
          name: testProduct.name,
          quantity: 5,
          selectedColor: '#ffffff',
          selectedSize: 'M',
        }],
      }),
    });
    assert(res.ok, `Quote calculation failed: ${res.status}`);
    const data = await res.json();
    assert(data.verifiedItems && data.verifiedItems.length === 1, 'Verified items missing');
    const item = data.verifiedItems[0];
    assert(item.unitPrice === 499, `Expected unitPrice 499 for 5 pcs, got ${item.unitPrice}`);
    assert(item.itemTotal === 499 * 5, `Expected itemTotal ${499 * 5}, got ${item.itemTotal}`);
  });

  await test('Cart Quote API calculates Tier 2 (10-49 pcs) with size breakdown', async () => {
    const sizeBreakdown = { S: 5, M: 5, L: 10, XL: 5 }; // Total = 25 pcs
    const res = await fetch(`${BASE_URL}/api/cart/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          productId: testProduct.id,
          name: testProduct.name,
          quantity: 25,
          sizeBreakdown,
          selectedColor: '#1a1a1a',
          selectedSize: 'S: 5, M: 5, L: 10, XL: 5',
          customization: {
            placement: 'Front Chest',
            logoUrl: uploadedPngUrl,
            logoFileName: 'company_logo.png',
            instructions: 'Golden screen print',
          },
        }],
      }),
    });
    assert(res.ok, `Quote calculation failed: ${res.status}`);
    const data = await res.json();
    const item = data.verifiedItems[0];
    assert(item.unitPrice === 449, `Expected unitPrice 449 for 25 pcs, got ${item.unitPrice}`);
    assert(item.quantity === 25, `Expected total quantity 25, got ${item.quantity}`);
    assert(item.customization && item.customization.instructions === 'Golden screen print', 'Customization instructions missing');
    assert(data.totalRetailTierSavings === (499 - 449) * 25, `Expected retail savings ${(499 - 449) * 25}, got ${data.totalRetailTierSavings}`);
  });

  await test('Cart Quote API calculates Tier 4 (100+ pcs) volume pricing', async () => {
    const res = await fetch(`${BASE_URL}/api/cart/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          productId: testProduct.id,
          name: testProduct.name,
          quantity: 120,
          selectedColor: '#1e3a8a',
          selectedSize: 'L',
        }],
      }),
    });
    assert(res.ok, `Quote calculation failed: ${res.status}`);
    const data = await res.json();
    const item = data.verifiedItems[0];
    assert(item.unitPrice === 349, `Expected unitPrice 349 for 120 pcs, got ${item.unitPrice}`);
  });

  // 4. Admin API Protection & CRUD
  await test('Admin Products API enforces security (403 when unauthenticated)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/products`);
    assert(res.status === 403, `Expected status 403 for unauthenticated call, got ${res.status}`);
  });

  let adminCookie = '';
  await test('Admin login authenticates and obtains secure session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@vgprintinghub.com',
        password: 'Admin@12345',
      }),
    });
    assert(res.ok, `Admin login failed: ${res.status}`);
    const rawCookie = res.headers.get('set-cookie');
    assert(rawCookie, 'Missing set-cookie in admin login response');
    adminCookie = rawCookie.split(';')[0];
  });

  let createdProductId = null;
  await test('Admin can create a new product with custom tiers, colors, and sizes', async () => {
    const payload = {
      name: 'E2E Test Corporate Jersey',
      price: 550,
      wholesalePrice: 320,
      description: 'Moisture wicking athletic corporate jersey',
      stock: 350,
      moq: 1,
      wholesaleMoq: 20,
      colors: ['#ffffff', '#000000', '#2563eb'],
      disabledColors: ['#000000'],
      colorImages: {
        '#ffffff': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        '#2563eb': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      },
      sizes: ['M', 'L', 'XL'],
      placements: ['Front Chest', 'Back Name & Number'],
      pricingTiers: [
        { minQty: 1, maxQty: 9, price: 550, wholesalePrice: 350 },
        { minQty: 10, maxQty: 49, price: 500, wholesalePrice: 320 },
        { minQty: 50, maxQty: null, price: 450, wholesalePrice: 280 },
      ],
      customizable: true,
      badge: 'Test Brand',
    };

    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
      body: JSON.stringify(payload),
    });
    assert(res.ok, `Admin create product failed: ${res.status}`);
    const data = await res.json();
    assert(data.success && data.product?.id, 'Product creation response invalid');
    createdProductId = data.product.id;
  });

  await test('Admin can update product configuration', async () => {
    assert(createdProductId, 'No product id to update');
    const updatePayload = {
      id: createdProductId,
      name: 'E2E Test Corporate Jersey (Updated)',
      price: 599,
      stock: 400,
    };

    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
      body: JSON.stringify(updatePayload),
    });
    assert(res.ok, `Admin update product failed: ${res.status}`);
    const data = await res.json();
    assert(data.success && data.product.name.includes('Updated'), 'Product name not updated');
    assert(data.product.price === 599, 'Product price not updated');
  });

  await test('Admin can delete the test product', async () => {
    assert(createdProductId, 'No product id to delete');
    const res = await fetch(`${BASE_URL}/api/admin/products?id=${createdProductId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': adminCookie,
      },
    });
    assert(res.ok, `Admin delete product failed: ${res.status}`);
    const data = await res.json();
    assert(data.success, 'Product delete response invalid');
  });

  console.log(`\n=== E2E LIVE TEST COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runLiveE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});


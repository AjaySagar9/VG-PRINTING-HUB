const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function fetchJson(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function runLiveTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING LIVE FULL PROJECT E2E TESTS (HTTP/API)');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function record(testName, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName} ${details}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${details}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 1. Home Page
  const homeRes = await fetch(`${BASE_URL}/`);
  record('Home Page (GET /)', homeRes.status === 200, `Status: ${homeRes.status}`);

  // 2. Catalog Page
  const catalogRes = await fetch(`${BASE_URL}/products`);
  record('Products Page (GET /products)', catalogRes.status === 200, `Status: ${catalogRes.status}`);

  // 3. Categories Page
  const categoriesRes = await fetch(`${BASE_URL}/categories`);
  record('Categories Page (GET /categories)', categoriesRes.status === 200, `Status: ${categoriesRes.status}`);

  // 4. Products API
  const prodRes = await fetchJson('/api/products');
  record('Products API (GET /api/products)', prodRes.ok && Array.isArray(prodRes.data.products), `Count: ${prodRes.data?.products?.length || 0} products`);
  record('Categories in Products API', Array.isArray(prodRes.data.categories) && prodRes.data.categories.length > 0, `Count: ${prodRes.data?.categories?.length || 0} categories`);

  // 5. Authentication: Login with Admin
  const loginRes = await fetchJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@vgprintinghub.com',
      password: 'Admin@12345',
    }),
  });
  record('Admin Login (POST /api/auth/login)', loginRes.ok && loginRes.data?.user?.email === 'admin@vgprintinghub.com', `User: ${loginRes.data?.user?.name}`);

  // Extract auth cookie
  const setCookie = loginRes.headers.get('set-cookie');
  const cookieMatch = setCookie ? setCookie.match(/vg_auth_token=([^;]+)/) : null;
  const token = cookieMatch ? cookieMatch[1] : '';
  record('Auth Cookie Extraction', Boolean(token), `Token Length: ${token.length}`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `vg_auth_token=${token}`,
  };

  // 6. Session Check: /api/auth/me
  const meRes = await fetchJson('/api/auth/me', { headers: authHeaders });
  record('Session Verification (GET /api/auth/me)', meRes.ok && meRes.data?.user?.role === 'ADMIN', `Role: ${meRes.data?.user?.role}`);

  // 7. Profile API: /api/user/profile
  const profileRes = await fetchJson('/api/user/profile', { headers: authHeaders });
  record('User Profile (GET /api/user/profile)', profileRes.ok && profileRes.data?.user?.email === 'admin@vgprintinghub.com', `Status: 200 OK`);

  // 8. Add Address API: /api/user/addresses
  const newAddrPayload = {
    name: 'VG Hub HQ Admin',
    phone: '9999988888',
    street: 'Plot 42, Udyog Vihar Phase 4',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122015',
    addressType: 'Both',
    isDefaultDelivery: true,
    isDefaultBilling: true,
    deliveryInstructions: 'Deliver at Reception Desk',
  };
  const addAddrRes = await fetchJson('/api/user/addresses', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(newAddrPayload),
  });
  record('Add Address (POST /api/user/addresses)', addAddrRes.status === 201 && addAddrRes.data?.address?.city === 'Gurugram', `Address ID: ${addAddrRes.data?.address?.id}`);
  const createdAddrId = addAddrRes.data?.address?.id;

  // 9. Fetch Addresses: /api/user/addresses
  const listAddrRes = await fetchJson('/api/user/addresses', { headers: authHeaders });
  record('List Addresses (GET /api/user/addresses)', listAddrRes.ok && listAddrRes.data?.addresses?.length > 0, `Addresses: ${listAddrRes.data?.addresses?.length}`);

  // 10. Save Design API: /api/user/designs
  const designPayload = {
    productName: 'Custom Corporate Bio-Wash T-Shirt',
    designName: 'Live Test Polo Emblem',
    previewSnapshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    placement: 'Front Chest',
    customText: 'VG HUB LIVE',
    textColor: '#ffffff',
    selectedColor: '#1a1a1a',
    selectedSize: 'XL',
  };
  const addDesignRes = await fetchJson('/api/user/designs', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(designPayload),
  });
  record('Save Design (POST /api/user/designs)', addDesignRes.status === 201 && addDesignRes.data?.design?.designName === 'Live Test Polo Emblem', `Design ID: ${addDesignRes.data?.design?.id}`);
  const createdDesignId = addDesignRes.data?.design?.id;

  // 11. List Designs API: /api/user/designs
  const listDesignRes = await fetchJson('/api/user/designs', { headers: authHeaders });
  record('List Designs (GET /api/user/designs)', listDesignRes.ok && listDesignRes.data?.designs?.length > 0, `Designs: ${listDesignRes.data?.designs?.length}`);

  // 12. Active Sessions Inspection
  const sessionRes = await fetchJson('/api/user/sessions', { headers: authHeaders });
  record('Inspect Sessions (GET /api/user/sessions)', sessionRes.ok && sessionRes.data?.currentSession?.browser, `Browser: ${sessionRes.data?.currentSession?.browser}`);

  // 13. Cart Quote Engine & Coupon Check
  const quoteRes = await fetchJson('/api/cart/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        {
          productId: prodRes.data.products[0]?.id || 'p1',
          name: prodRes.data.products[0]?.name || 'Test Shirt',
          quantity: 2,
          selectedColor: '#ffffff',
          selectedSize: 'L',
        },
      ],
      couponCode: 'WELCOME10',
    }),
  });
  record('Cart Pricing Quote Engine (POST /api/cart/quote)', quoteRes.ok && quoteRes.data?.subtotal > 0, `Subtotal: ₹${quoteRes.data?.subtotal}, Discount: ₹${quoteRes.data?.discount}`);

  // 14. Coupon Validation API
  const couponRes = await fetchJson('/api/cart/coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'WELCOME10', subtotal: 1000 }),
  });
  record('Coupon Validation API (POST /api/cart/coupon)', couponRes.ok && couponRes.data?.discountValue === 10, `Discount: ${couponRes.data?.discountValue}%`);

  // 15. Customer Account Dashboard Page
  const accountPageRes = await fetch(`${BASE_URL}/account`);
  record('Customer Account Page (GET /account)', accountPageRes.status === 200, `Status: ${accountPageRes.status}`);

  // 16. Orders List API
  const ordersRes = await fetchJson('/api/orders', { headers: authHeaders });
  record('Customer Orders API (GET /api/orders)', ordersRes.ok && Array.isArray(ordersRes.data?.orders), `Orders Count: ${ordersRes.data?.orders?.length || 0}`);

  // Clean up created test address and design
  if (createdAddrId) {
    await fetch(`${BASE_URL}/api/user/addresses?id=${createdAddrId}`, { method: 'DELETE', headers: authHeaders });
  }
  if (createdDesignId) {
    await fetch(`${BASE_URL}/api/user/designs?id=${createdDesignId}`, { method: 'DELETE', headers: authHeaders });
  }

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed}/${total} LIVE TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================');
}

runLiveTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});

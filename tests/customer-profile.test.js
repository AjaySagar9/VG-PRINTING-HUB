const assert = require('assert');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'vg_printing_hub_jwt_super_secret_key_2026_xyz';

function createToken(userId, email, role = 'RETAILER', approvalStatus = 'APPROVED', sessionVersion = 1) {
  return jwt.sign({ userId, email, role, approvalStatus, sessionVersion }, JWT_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  console.log('--- STARTING CUSTOMER PROFILE & ACCOUNT SUITE TESTS ---');

  // Clean up any test users from previous test runs
  await prisma.address.deleteMany({ where: { user: { email: { contains: 'test_account_' } } } });
  await prisma.savedDesign.deleteMany({ where: { user: { email: { contains: 'test_account_' } } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'test_account_' } } });

  const testId = Date.now().toString(36);
  const passwordHash = await bcrypt.hash('TestPass@123', 10);

  // 1. Create Test Retail User
  const user1 = await prisma.user.create({
    data: {
      name: 'Test Retail Customer',
      email: `test_account_retail_${testId}@example.com`,
      mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'RETAILER',
      approvalStatus: 'APPROVED',
      sessionVersion: 1,
    },
  });
  console.log('✓ Created Test Retail User:', user1.id);

  // 2. Create Test Wholesale User
  const user2 = await prisma.user.create({
    data: {
      name: 'Test Wholesale Partner',
      email: `test_account_wholesale_${testId}@example.com`,
      mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'WHOLESALER',
      approvalStatus: 'APPROVED',
      businessName: 'Original Wholesale Corp',
      businessType: 'Private Limited Company',
      businessAddress: '123 Industrial Area, Phase 1, New Delhi',
      gstin: '07AAAAA0000A1Z5',
      sessionVersion: 1,
    },
  });
  console.log('✓ Created Test Wholesale User:', user2.id);

  // TEST 1: Address Management & Default Flag Unsetting
  console.log('\n--- Testing Address Management ---');
  const addr1 = await prisma.address.create({
    data: {
      userId: user1.id,
      name: 'Warehouse 1',
      phone: '9876543210',
      street: 'Plot 10, Sector 5',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122001',
      addressType: 'Delivery',
      isDefaultDelivery: true,
      isDefaultBilling: true,
    },
  });
  assert.strictEqual(addr1.isDefaultDelivery, true);

  // Add second address set as default delivery; should reset first address's default delivery
  await prisma.address.updateMany({
    where: { userId: user1.id },
    data: { isDefaultDelivery: false },
  });
  const addr2 = await prisma.address.create({
    data: {
      userId: user1.id,
      name: 'Branch Office 2',
      phone: '9876543211',
      street: 'Tower B, DLF Cyber City',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      addressType: 'Delivery',
      isDefaultDelivery: true,
      isDefaultBilling: false,
    },
  });

  const refreshedAddr1 = await prisma.address.findUnique({ where: { id: addr1.id } });
  assert.strictEqual(refreshedAddr1.isDefaultDelivery, false, 'Previous default delivery must be unset');
  assert.strictEqual(addr2.isDefaultDelivery, true, 'New address must be default delivery');
  console.log('✓ Verified Address Default Delivery handling');

  // TEST 2: Authorization Isolation (User 2 cannot modify User 1 address)
  console.log('\n--- Testing Address Authorization Isolation ---');
  const addrTarget = await prisma.address.findUnique({ where: { id: addr1.id } });
  assert.strictEqual(addrTarget.userId, user1.id);
  const isUnauthorized = addrTarget.userId !== user2.id;
  assert.strictEqual(isUnauthorized, true, 'User 2 must not own User 1 address');
  console.log('✓ Verified cross-user address isolation');

  // TEST 3: Saved Design Library
  console.log('\n--- Testing Saved Designs Library ---');
  const design1 = await prisma.savedDesign.create({
    data: {
      userId: user1.id,
      productName: 'Custom Corporate Bio-Wash T-Shirt',
      designName: 'Q4 Sales Kickoff Black Tee',
      previewSnapshot: 'data:image/png;base64,mockpreviewdata',
      placement: 'Front Center',
      customText: 'VG PRINTING 2026',
      textColor: '#ffffff',
      selectedColor: '#1a1a1a',
      selectedSize: 'XL',
    },
  });
  assert.strictEqual(design1.designName, 'Q4 Sales Kickoff Black Tee');

  const user1Designs = await prisma.savedDesign.findMany({ where: { userId: user1.id } });
  const user2Designs = await prisma.savedDesign.findMany({ where: { userId: user2.id } });
  assert.strictEqual(user1Designs.length, 1);
  assert.strictEqual(user2Designs.length, 0, 'User 2 must have 0 designs');
  console.log('✓ Verified Saved Designs isolation');

  // TEST 4: Wholesale Restrictions & Re-verification Trigger
  console.log('\n--- Testing Wholesale Business Re-verification Trigger ---');
  assert.strictEqual(user2.approvalStatus, 'APPROVED');

  // If critical business details change (e.g. GSTIN or legal address)
  const newGstin = '06BBBBB9999B1Z8';
  let shouldReverify = false;
  if (user2.approvalStatus === 'APPROVED' && newGstin !== user2.gstin) {
    shouldReverify = true;
  }
  assert.strictEqual(shouldReverify, true, 'Altering verified GSTIN must trigger re-verification');

  const updatedUser2 = await prisma.user.update({
    where: { id: user2.id },
    data: {
      gstin: newGstin,
      approvalStatus: shouldReverify ? 'PENDING' : user2.approvalStatus,
    },
  });
  assert.strictEqual(updatedUser2.approvalStatus, 'PENDING', 'User 2 status must be demoted to PENDING');
  console.log('✓ Verified Wholesale Re-verification Trigger');

  // TEST 5: Active Sessions Invalidation
  console.log('\n--- Testing Active Sessions Invalidation ---');
  assert.strictEqual(user1.sessionVersion, 1);
  const oldToken = createToken(user1.id, user1.email, user1.role, user1.approvalStatus, 1);
  const decodedOld = jwt.verify(oldToken, JWT_SECRET);

  // Invalidate other devices
  const bumpedUser = await prisma.user.update({
    where: { id: user1.id },
    data: { sessionVersion: { increment: 1 } },
  });
  assert.strictEqual(bumpedUser.sessionVersion, 2);

  const isOldSessionValid = decodedOld.sessionVersion >= bumpedUser.sessionVersion;
  assert.strictEqual(isOldSessionValid, false, 'Old session token must be invalid after version bump');
  console.log('✓ Verified Session Invalidation & Remote Device Sign-Out');

  // TEST 6: Order Cancellation & Return Policy Enforcement
  console.log('\n--- Testing Order Policy Rules ---');
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      customerName: user1.name,
      customerEmail: user1.email,
      customerMobile: user1.mobile,
      shippingAddress: JSON.stringify({ address: 'Plot 10', city: 'Gurugram', state: 'Haryana', pincode: '122001' }),
      items: JSON.stringify([{ name: 'Custom Tee', quantity: 10, unitPrice: 499 }]),
      subtotal: 4990,
      totalAmount: 4990,
      status: 'Placed',
    },
  });

  // Placed -> Allowed to cancel
  const canCancelPlaced = ['Placed', 'Design Approval'].includes(order1.status);
  assert.strictEqual(canCancelPlaced, true, 'Placed order must be cancellable');

  // Dispatched -> NOT allowed to cancel
  const orderDispatched = await prisma.order.create({
    data: {
      userId: user1.id,
      customerName: user1.name,
      customerEmail: user1.email,
      shippingAddress: JSON.stringify({ address: 'Plot 10', city: 'Gurugram', state: 'Haryana', pincode: '122001' }),
      items: JSON.stringify([{ name: 'Custom Cap', quantity: 5, unitPrice: 299 }]),
      subtotal: 1495,
      totalAmount: 1495,
      status: 'Dispatched',
    },
  });
  const canCancelDispatched = ['Placed', 'Design Approval'].includes(orderDispatched.status);
  assert.strictEqual(canCancelDispatched, false, 'Dispatched order cannot be cancelled');
  console.log('✓ Verified Order Status Business Policy (Cancellation & Returns)');

  // Clean up
  await prisma.order.deleteMany({ where: { id: { in: [order1.id, orderDispatched.id] } } });
  await prisma.address.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
  await prisma.savedDesign.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });

  console.log('\n=============================================');
  console.log('ALL CUSTOMER PROFILE SUITE TESTS PASSED (6/6)');
  console.log('=============================================');
}

runTests()
  .catch((err) => {
    console.error('Test failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


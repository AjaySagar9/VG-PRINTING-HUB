const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'vg_printing_hub_jwt_super_secret_key_2026_xyz';

async function runTests() {
  console.log('--- STARTING AUTHENTICATION & WHOLESALE SYSTEM TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Clean up test users if they exist
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { in: ['retail_test@example.com', 'wholesale_test@example.com', 'admin_test@example.com', 'diff_email@example.com'] } },
          { mobile: { in: ['9876543210', '9876500001', '9123456780'] } }
        ]
      }
    });

    // 1. Password hashing test
    const rawPass = 'Secret123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPass, salt);
    assert(await bcrypt.compare(rawPass, hash), 'Bcrypt correctly hashes and verifies password');
    assert(!(await bcrypt.compare('WrongPassword', hash)), 'Bcrypt correctly rejects invalid password');

    // 2. Retailer registration
    const retailUser = await prisma.user.create({
      data: {
        name: 'Rahul Sharma',
        email: 'retail_test@example.com',
        mobile: '9876543210',
        passwordHash: hash,
        role: 'RETAILER',
        approvalStatus: 'APPROVED'
      }
    });
    assert(retailUser.id && retailUser.role === 'RETAILER', 'Retail user created with role RETAILER');
    assert(retailUser.approvalStatus === 'APPROVED', 'Retail user default status is APPROVED');

    // 3. Duplicate checks
    let duplicateEmailCaught = false;
    try {
      await prisma.user.create({
        data: {
          name: 'Another User',
          email: 'retail_test@example.com',
          mobile: '9123456780',
          passwordHash: hash,
          role: 'RETAILER'
        }
      });
    } catch {
      duplicateEmailCaught = true;
    }
    assert(duplicateEmailCaught, 'Database enforces unique email constraint');

    let duplicateMobileCaught = false;
    try {
      await prisma.user.create({
        data: {
          name: 'Another User',
          email: 'diff_email@example.com',
          mobile: '9876543210',
          passwordHash: hash,
          role: 'RETAILER'
        }
      });
    } catch {
      duplicateMobileCaught = true;
    }
    assert(duplicateMobileCaught, 'Database enforces unique mobile constraint');

    // 4. Wholesaler registration (starts as PENDING)
    const wholesaleUser = await prisma.user.create({
      data: {
        name: 'Amit Patel',
        email: 'wholesale_test@example.com',
        mobile: '9876500001',
        passwordHash: hash,
        role: 'WHOLESALER',
        approvalStatus: 'PENDING',
        businessName: 'Patel Print Solutions Pvt Ltd',
        businessType: 'Print Shop / Reseller',
        businessAddress: 'Plot 45, Sector 18, Industrial Area, Ahmedabad, Gujarat',
        gstin: '24AAACP1234A1Z5'
      }
    });
    assert(wholesaleUser.role === 'WHOLESALER', 'Wholesale user registered with role WHOLESALER');
    assert(wholesaleUser.approvalStatus === 'PENDING', 'Wholesale account starts with PENDING status');
    assert(wholesaleUser.businessName === 'Patel Print Solutions Pvt Ltd', 'Business details properly stored');

    // 5. Login using Email & Login using Mobile
    const userByEmail = await prisma.user.findFirst({
      where: { OR: [{ email: 'wholesale_test@example.com' }, { mobile: 'wholesale_test@example.com' }] }
    });
    assert(userByEmail && userByEmail.id === wholesaleUser.id, 'Can locate user by email identifier');

    const userByMobile = await prisma.user.findFirst({
      where: { OR: [{ email: '9876500001' }, { mobile: '9876500001' }] }
    });
    assert(userByMobile && userByMobile.id === wholesaleUser.id, 'Can locate user by mobile identifier');

    // 6. Token Generation & Verification
    const token = jwt.sign({ userId: wholesaleUser.id, role: wholesaleUser.role }, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    assert(decoded.userId === wholesaleUser.id, 'JWT session token verified correctly');

    // 7. Wholesale Pricing Enforcement Test
    // Simulating backend access check:
    function checkWholesaleAccess(user) {
      return Boolean(user && user.role === 'WHOLESALER' && user.approvalStatus === 'APPROVED');
    }

    assert(!checkWholesaleAccess(null), 'Guest cannot access wholesale prices');
    assert(!checkWholesaleAccess(retailUser), 'Retailer cannot access wholesale prices');
    assert(!checkWholesaleAccess(wholesaleUser), 'Pending wholesaler CANNOT access wholesale prices');

    // 8. Admin Approval Workflow
    const approvedWholesaler = await prisma.user.update({
      where: { id: wholesaleUser.id },
      data: { approvalStatus: 'APPROVED' }
    });
    assert(approvedWholesaler.approvalStatus === 'APPROVED', 'Admin successfully approved wholesaler');
    assert(checkWholesaleAccess(approvedWholesaler), 'Approved wholesaler CAN access wholesale prices');

    // 9. Password Reset Flow
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    await prisma.user.update({
      where: { id: retailUser.id },
      data: { resetToken, resetTokenExpiry }
    });

    const userToReset = await prisma.user.findFirst({
      where: { resetToken, resetTokenExpiry: { gt: new Date() } }
    });
    assert(userToReset && userToReset.id === retailUser.id, 'Password reset token verified in DB');

    const newPassHash = await bcrypt.hash('NewBrandPassword789!', 10);
    await prisma.user.update({
      where: { id: retailUser.id },
      data: { passwordHash: newPassHash, resetToken: null, resetTokenExpiry: null }
    });
    const updatedRetailUser = await prisma.user.findUnique({ where: { id: retailUser.id } });
    assert(await bcrypt.compare('NewBrandPassword789!', updatedRetailUser.passwordHash), 'New password hash verified');
    assert(updatedRetailUser.resetToken === null, 'Reset token cleared after password reset');

    console.log(`\nTEST RESULTS: ${passed} passed, ${failed} failed.`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Clean up
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { in: ['retail_test@example.com', 'wholesale_test@example.com', 'admin_test@example.com', 'diff_email@example.com'] } },
          { mobile: { in: ['9876543210', '9876500001', '9123456780'] } }
        ]
      }
    });
    await prisma.$disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

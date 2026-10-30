import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import {
  getCurrentUser,
  serializeUser,
  signToken,
  COOKIE_NAME,
  getAuthCookieOptions,
  validateEmail,
  validateMobile,
  normalizeMobile,
  validateGSTIN,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      mobile,
      avatarUrl,
      notificationPrefs,
      // Wholesale fields
      businessName,
      businessType,
      contactPerson,
      businessAddress,
      businessWebsite,
      gstin,
    } = body;

    const updateData = {};
    let emailChanged = false;
    let mobileChanged = false;
    let wholesaleReverificationTriggered = false;

    // 1. Full Name
    if (typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters long' },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
    }

    // 2. Avatar URL
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl && typeof avatarUrl === 'string' ? avatarUrl.trim() : null;
    }

    // 3. Email update & validation
    if (email && typeof email === 'string') {
      const normalizedEmail = email.trim().toLowerCase();
      if (!validateEmail(normalizedEmail)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      if (normalizedEmail !== currentUser.email) {
        // Check uniqueness
        const duplicate = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: currentUser.id },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: 'This email address is already in use by another account' },
            { status: 409 }
          );
        }

        emailChanged = true;
        updateData.email = normalizedEmail;
        updateData.isEmailVerified = false;
        // Generate 6-digit OTP code
        updateData.emailVerifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      }
    }

    // 4. Mobile update & validation
    if (mobile && typeof mobile === 'string') {
      const cleanMobile = normalizeMobile(mobile);
      if (!validateMobile(cleanMobile)) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit Indian mobile number' },
          { status: 400 }
        );
      }

      if (cleanMobile !== currentUser.mobile) {
        const duplicate = await prisma.user.findFirst({
          where: {
            mobile: cleanMobile,
            id: { not: currentUser.id },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: 'This mobile number is already in use by another account' },
            { status: 409 }
          );
        }

        mobileChanged = true;
        updateData.mobile = cleanMobile;
        updateData.isMobileVerified = false;
        // Generate 6-digit OTP code
        updateData.mobileVerifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      }
    }

    // 5. Notification Preferences
    if (notificationPrefs !== undefined) {
      if (typeof notificationPrefs === 'object' && notificationPrefs !== null) {
        updateData.notificationPrefs = JSON.stringify(notificationPrefs);
      } else if (typeof notificationPrefs === 'string') {
        updateData.notificationPrefs = notificationPrefs;
      }
    }

    // 6. Wholesale Business Profile (only allowed if user role is WHOLESALER)
    if (currentUser.role === 'WHOLESALER') {
      let gstinChanged = false;
      let bizNameChanged = false;
      let bizAddressChanged = false;

      if (typeof businessName === 'string') {
        const trimmed = businessName.trim();
        if (trimmed && trimmed !== currentUser.businessName) {
          updateData.businessName = trimmed;
          bizNameChanged = true;
        }
      }

      if (typeof businessType === 'string') {
        updateData.businessType = businessType.trim();
      }

      if (typeof contactPerson === 'string') {
        updateData.contactPerson = contactPerson.trim();
      }

      if (typeof businessAddress === 'string') {
        const trimmed = businessAddress.trim();
        if (trimmed && trimmed !== currentUser.businessAddress) {
          updateData.businessAddress = trimmed;
          bizAddressChanged = true;
        }
      }

      if (businessWebsite !== undefined) {
        updateData.businessWebsite = businessWebsite ? businessWebsite.trim() : null;
      }

      if (gstin !== undefined) {
        const trimmedGSTIN = gstin ? gstin.trim().toUpperCase() : null;
        if (trimmedGSTIN) {
          if (!validateGSTIN(trimmedGSTIN)) {
            return NextResponse.json(
              { error: 'Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)' },
              { status: 400 }
            );
          }
          if (trimmedGSTIN !== currentUser.gstin) {
            updateData.gstin = trimmedGSTIN;
            gstinChanged = true;
          }
        } else {
          updateData.gstin = null;
        }
      }

      // Security requirement: If verified wholesale details change, trigger admin re-verification
      if (
        currentUser.approvalStatus === 'APPROVED' &&
        (gstinChanged || bizNameChanged || bizAddressChanged)
      ) {
        updateData.approvalStatus = 'PENDING';
        wholesaleReverificationTriggered = true;
      }
    }

    // 7. Security: Never allow customer to tamper with role, approvalStatus, or wholesaleTier directly
    delete updateData.role;
    delete updateData.wholesaleTier;
    delete updateData.passwordHash;
    delete updateData.isDeleted;

    // 8. Update in Database
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    // 9. If email changed, refresh the session token
    if (emailChanged || wholesaleReverificationTriggered) {
      const token = signToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus,
        sessionVersion: updatedUser.sessionVersion || 1,
      });
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, getAuthCookieOptions());
    }

    let message = 'Profile updated successfully!';
    if (wholesaleReverificationTriggered) {
      message = 'Business details updated! Because critical credentials were changed, your wholesale account has been queued for admin re-verification.';
    } else if (emailChanged && mobileChanged) {
      message = 'Email and mobile updated! Please verify your new contact details.';
    } else if (emailChanged) {
      message = 'Email updated! Please verify your new email address.';
    } else if (mobileChanged) {
      message = 'Mobile number updated! Please verify your new mobile number.';
    }

    return NextResponse.json({
      message,
      user: serializeUser(updatedUser),
      emailChanged,
      mobileChanged,
      wholesaleReverificationTriggered,
      testCodes: process.env.NODE_ENV !== 'production' ? {
        emailVerifyCode: updateData.emailVerifyCode,
        mobileVerifyCode: updateData.mobileVerifyCode,
      } : undefined,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating profile' },
      { status: 500 }
    );
  }
}


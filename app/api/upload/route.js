import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Configure Cloudinary if credentials exist in environment
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate MIME type
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed formats: PNG, JPG, JPEG, WEBP, SVG, PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 15MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));

    let publicUrl = '';
    let storedFilename = '';

    // 1. Cloudinary upload (Production / Cloud Mode)
    if (hasCloudinary) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'vg_printing_hub/artworks',
            resource_type: isPdf ? 'raw' : 'auto',
            public_id: `artwork_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      publicUrl = uploadResult.secure_url;
      storedFilename = uploadResult.public_id;
    } else {
      // 2. Local filesystem storage (Local Development Fallback)
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const ext = file.name ? path.extname(file.name) || '.png' : '.png';
        const cleanExt = ext.toLowerCase();
        storedFilename = `artwork_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${cleanExt}`;
        const filePath = path.join(uploadDir, storedFilename);

        fs.writeFileSync(filePath, buffer);
        publicUrl = `/uploads/${storedFilename}`;
      } catch (fsErr) {
        // Read-only filesystem error detection on Vercel
        if (fsErr.code === 'EROFS' || fsErr.message?.includes('read-only')) {
          return NextResponse.json(
            {
              error: 'Serverless read-only filesystem detected. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel Environment Variables to store uploads permanently.',
            },
            { status: 500 }
          );
        }
        throw fsErr;
      }
    }

    return NextResponse.json({
      url: publicUrl,
      filename: storedFilename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      isPdf,
      storage: hasCloudinary ? 'cloudinary' : 'local',
      message: 'Artwork uploaded successfully',
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process artwork upload. Please try again.' },
      { status: 500 }
    );
  }
}

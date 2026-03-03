/**
 * Script to configure CORS on Cloudflare R2 bucket
 * Uses the R2 S3-compatible API
 *
 * Usage: node scripts/setup-r2-cors.js
 *
 * Requires environment variables:
 * - VITE_R2_ACCESS_KEY_ID
 * - VITE_R2_SECRET_ACCESS_KEY
 */

import { config } from 'dotenv';
config(); // Load .env file

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

// R2 Configuration
const R2_ACCOUNT_ID = 'fce57ea059c228c5cec72d0b7055c268';
const R2_BUCKET_NAME = 'architex';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// CORS Configuration
const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: [
        'https://architex-ai-system-1.vercel.app',
        'https://*.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
      ],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag', 'x-amz-request-id', 'x-amz-id-2'],
      MaxAgeSeconds: 3000
    }
  ]
};

async function setupCors() {
  const accessKeyId = process.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.VITE_R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ Error: R2 credentials not found in environment variables.');
    console.error('Please set VITE_R2_ACCESS_KEY_ID and VITE_R2_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  try {
    // First, test connectivity by listing buckets
    console.log('🔍 Testing R2 connectivity...');
    const { ListBucketsCommand } = await import('@aws-sdk/client-s3');
    const buckets = await s3Client.send(new ListBucketsCommand({}));
    console.log(`✅ Connected to R2. Available buckets:`);
    buckets.Buckets?.forEach(bucket => {
      console.log(`   - ${bucket.Name}`);
    });
    console.log('');

    // Check if the target bucket exists
    const bucketExists = buckets.Buckets?.some(b => b.Name === R2_BUCKET_NAME);
    if (!bucketExists) {
      console.error(`❌ Bucket "${R2_BUCKET_NAME}" not found in your R2 account.`);
      console.error('   Please verify the bucket name in src/services/r2StorageService.ts');
      console.error('   Available buckets are listed above.');
      process.exit(1);
    }

    console.log(`🔧 Configuring CORS for bucket: ${R2_BUCKET_NAME}`);
    console.log(`   Endpoint: ${R2_ENDPOINT}`);
    
    const { PutBucketCorsCommand } = await import('@aws-sdk/client-s3');
    const command = new PutBucketCorsCommand({
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: corsConfig
    });

    await s3Client.send(command);
    
    console.log('✅ CORS configuration applied successfully!');
    console.log('');
    console.log('Configuration:');
    console.log('- Allowed origins:', corsConfig.CORSRules[0].AllowedOrigins.join('\n  '));
    console.log('- Allowed methods:', corsConfig.CORSRules[0].AllowedMethods.join(', '));
    console.log('- Max age:', corsConfig.CORSRules[0].MaxAgeSeconds, 'seconds');
    console.log('');
    console.log('🎉 File uploads should now work from your Vercel domain!');
    
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message);
    if (error.name === 'NoSuchBucket') {
      console.error('\n💡 Tip: Make sure the R2 bucket "architex" exists.');
    } else if (error.name === 'AccessDenied' || error.message.includes('Access Denied')) {
      console.error('\n💡 Tip: Access Denied - Your API token may not have sufficient permissions.');
      console.error('   Required permissions: Object Read, Object Write, and Bucket Read/Write (Admin)');
      console.error('   Create a new API token with full access to all R2 buckets.');
    }
    process.exit(1);
  }
}

setupCors();

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
    console.log(`🔧 Configuring CORS for bucket: ${R2_BUCKET_NAME}`);
    console.log(`   Endpoint: ${R2_ENDPOINT}`);
    
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
    }
    process.exit(1);
  }
}

setupCors();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  images: {
    domains: [
      'localhost',
      'cloudaip.com',
      'res.cloudinary.com',
      's3.amazonaws.com',
      'cloudaip-assets.s3.amazonaws.com',
    ],
  },
};

module.exports = nextConfig;

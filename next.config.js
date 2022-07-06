/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = {
  env: {
    API_KEY: process.env.NEXT_PUBLIC_API_KEY,
  },
};
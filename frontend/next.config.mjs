/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  
  async rewrites() {
    return {
      // 🛡️ beforeFiles forces Next.js to run the proxy BEFORE checking local folders
      beforeFiles: [
        {
          source: '/api/:path*',
          // 🛡️ Added a fallback string just in case Vercel drops the environment variable
          destination: `${process.env.BACKEND_API_URL || 'https://satyashodhak-udyojak-portal-production.up.railway.app'}/api/:path*`, 
        },
      ]
    }
  },
};

export default nextConfig;
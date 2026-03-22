/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  
  async rewrites() {
    return {
      // 🛡️ beforeFiles forces the proxy to run BEFORE checking any local 'src/app/api' folders
      beforeFiles: [
        {
          source: '/api/:path*',
          // 🛡️ Securely relies only on the environment variable
          destination: `${process.env.BACKEND_API_URL}/api/:path*`, 
        },
      ]
    }
  },
};

export default nextConfig;
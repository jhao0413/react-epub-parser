/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  basePath: "/react-epub-parser",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

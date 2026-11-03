import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose while this is a scaffold: it forces every
  // dynamic read into <Suspense> + `use cache`. Turn it on once the data layer
  // is settled.
  cacheComponents: false,
  experimental: {
    // Server Actions cap the request body at 1 MB by default. Product photo
    // uploads allow MAX_IMAGES_PER_UPLOAD (6) files of MAX_IMAGE_BYTES (5 MB)
    // each from src/lib/catalog/images.ts, plus multipart overhead.
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  images: {
    // Product photos live in the Supabase Storage bucket `product-images`.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

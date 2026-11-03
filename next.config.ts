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
    // `src/proxy.ts` matches /admin/:path*, so Next.js clones and buffers every
    // request body for proxy, and that cap defaults to 10 MB. Past it the body
    // is silently truncated and the request still returns HTTP 200, which turns
    // a legal multi-file upload into a corrupt one. Both keys are sized from the
    // same MAX_IMAGE_BYTES * MAX_IMAGES_PER_UPLOAD budget: raise one and you
    // must raise the other, or proxy truncates before the action can validate.
    proxyClientMaxBodySize: "32mb",
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

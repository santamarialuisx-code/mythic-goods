import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose while this is a scaffold: it forces every
  // dynamic read into <Suspense> + `use cache`. Turn it on once the data layer
  // is settled.
  cacheComponents: false,
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

import type { NextConfig } from "next";
import { reviewSourceVersion } from "./src/lib/review/source-version";

// ShotCo Review (SHO-1125): the reviewed build revision, resolved once at build
// time. This exposes that one value to the browser and no other server variable.
const nextConfig: NextConfig = {
  env: { REVIEW_SOURCE_VERSION: reviewSourceVersion() },
};

export default nextConfig;

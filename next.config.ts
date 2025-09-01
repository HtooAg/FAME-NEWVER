import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	turbopack: {
		root: __dirname,
	},
	typescript: {
		// Skip type checking during build
		ignoreBuildErrors: true,
	},
	eslint: {
		// Skip ESLint during build
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;

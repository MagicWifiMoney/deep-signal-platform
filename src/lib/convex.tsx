"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Check if Convex is configured
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Create client only if URL is set
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If Convex isn't configured, just render children without provider
  if (!convex) {
    return children;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

// Export for direct use
export { convex };

// Helper to check if Convex is available
export function isConvexConfigured(): boolean {
  return !!convexUrl && !convexUrl.includes("placeholder");
}

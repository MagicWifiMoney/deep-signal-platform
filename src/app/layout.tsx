import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/lib/convex'
import "./globals-v4.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Deep Signal | AI Agents as a Service",
  description: "Enterprise-grade AI assistants, deployed and managed for your business.",
  icons: {
    icon: "/favicon.ico",
  },
};

// Check if Clerk is properly configured
const clerkEnabled = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

function ClerkWrapper({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) {
    return <>{children}</>;
  }
  
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#06b6d4',
          colorBackground: '#0f172a',
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-slate-950`}>
        <ConvexClientProvider>
          <ClerkWrapper>
            {children}
          </ClerkWrapper>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

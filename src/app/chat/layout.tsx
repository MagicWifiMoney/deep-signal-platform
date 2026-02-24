import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Deep Signal',
  description: 'Chat with your AI agent',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

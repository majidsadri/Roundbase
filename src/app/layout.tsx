import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roundbase — Investor Pipeline Manager',
  description: 'Track investors, manage your pipeline, and never miss a follow-up.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}

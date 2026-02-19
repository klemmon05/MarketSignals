import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'ProSignal Analytics',
  description: 'Daily transformation trigger intelligence'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="container-pro flex items-center justify-between py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-ink">ProSignal Analytics</Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/reports/latest">Latest report</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="container-pro py-8">{children}</main>
      </body>
    </html>
  );
}

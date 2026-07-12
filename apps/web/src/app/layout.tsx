import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aureus — Hospitality ERP',
  description: 'One platform to run your entire hospitality business.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        {/* Apply stored theme before paint to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('aureus.theme');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch{}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata = {
  title: "My Shirt Canvas - Sign Out with WDK",
  description: "Leave your signature flat on my digital university sign-out shirt! A real-time shared milestone guestbook built by Web Design King",
  openGraph: {
    title: "My Shirt Canvas - Sign Out with WDK",
    description: "Leave your signature flat on my digital university sign-out shirt! A real-time shared milestone guestbook built by Engr. Great.",
    url: "https://myshirtcanvas.vercel.app/", 
    siteName: "My Shirt Canvas - Sign Out with WDK",
    locale: "en_US",
    type: "website",
  },
};


export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

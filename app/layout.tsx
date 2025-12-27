import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import logo from '../public/images/logo.png'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Devy App',
  description: 'Ai code generete',
  generator: 'devy',
  icons: {
    icon: [
      
      {
        url: `${logo}`,
        type: '',
      }
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        
        {children}
        <Analytics />
      </body>
    </html>
  )
}

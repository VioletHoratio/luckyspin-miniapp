import type { Metadata } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'

import './globals.css'
import { appConfig } from '@/lib/appConfig'
import { Providers } from '@/components/providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://luckyspin-miniapp.vercel.app'),
  title: 'LuckySpin | Base Mini App',
  description:
    'Spin the onchain wheel on Base, fund the jackpot pool, and reveal transparent rewards with instant replay energy.',
  openGraph: {
    title: 'LuckySpin',
    description:
      'A fast GameFi lottery Mini App on Base with jackpot pool growth, transparent rounds, and repeat spins.',
    url: 'https://luckyspin-miniapp.vercel.app',
    siteName: 'LuckySpin',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LuckySpin',
    description:
      'Spin, reveal, and claim from a transparent Base jackpot pool.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="base:app_id" content={appConfig.baseAppId} />
        <meta
          name="talentapp:project_verification"
          content={appConfig.projectVerification}
        />
      </head>
      <body className="font-[family-name:var(--font-body)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/app/providers"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Cognito — Verifiable AI Agent Memory",
  description:
    "Every agent action logged, stored on Walrus, indexed in SuiSQL, and anchored to Sui mainnet. Cryptographically verifiable. Permanently uncensorable.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: "/apple-icon.png",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="m-0 p-0 h-full w-full">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>
            <Suspense fallback={null}>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-md focus:shadow-lg"
              >
                Skip to content
              </a>
              {children}
            </Suspense>
          </Providers>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

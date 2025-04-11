import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cyber Shooter - PlayGame",
  description: "Created with v0",
  generator: "v0.dev",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzgwMDBmZiIgZD0iTTEyIDJMNCA3djEwbDggNWw4LTV2LTEwTDEyIDJ6TTEyIDR2MTZsLTYtMy43NVY4LjVMMTIgNHoiLz48L3N2Zz4=",
        type: "image/svg+xml",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}

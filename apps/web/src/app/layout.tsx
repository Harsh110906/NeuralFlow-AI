import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NeuralFlow AI Dashboard',
  description: 'The AI Operating System for Autonomous Business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-zinc-950 text-white min-h-screen font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}

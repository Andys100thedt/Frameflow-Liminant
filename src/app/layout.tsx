import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contextual-Liminal | Flow Editor",
  description: "A visual workflow editor for executing local functions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Song Analyzer</title>
        <meta name="description" content="Analyze song lyrics for content and meaning" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

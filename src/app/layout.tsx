import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Media Pembelajaran Sejarah - SMA 1 Limboto",
  description: "Platform media pembelajaran digital untuk mata pelajaran Sejarah SMA Negeri 1 Limboto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

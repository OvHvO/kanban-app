import type { Metadata } from "next";
import { Kalam } from "next/font/google";
import "./globals.css";

const kalam = Kalam({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
});

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "Excalidraw-style Kanban Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${kalam.variable} font-sans antialiased`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-200">
        {children}
      </body>
    </html>
  );
}

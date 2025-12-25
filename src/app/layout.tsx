import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";

// const inter = Inter({ subsets: ["latin"] }); 
// Using system fonts or a variable font if configured, but keeping it simple as per plan.
// Actually plan said "Apply MainLayout or basic font setup".

export const metadata: Metadata = {
  title: "SLR Helper",
  description: "Systematic Literature Review Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}

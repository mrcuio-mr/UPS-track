import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "物流追踪系统",
  description: "批量监控快递运输状态",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

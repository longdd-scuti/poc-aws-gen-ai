import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Bedrock GenAI Chat Studio",
  description: "PoC for AWS Bedrock Intelligent Prompt Routing and Knowledge Base RAG Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Comfortaa } from "next/font/google";
import "./globals.css";
import { GraphEditorProvider } from "@/contexts/GraphEditorContext";

const inter = Inter({ subsets: ["latin"] });
const comfortaa = Comfortaa({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Noodi.io",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-theme="light">
      <body className={comfortaa.className}>
        <GraphEditorProvider>{children}</GraphEditorProvider>
      </body>
    </html>
  );
}

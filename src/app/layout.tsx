import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import localFont from "next/font/local"
import "./globals.css";
import { GraphEditorProvider } from "@/contexts/GraphEditorContext";

//const comfortaa = Comfortaa({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"] });
const comfortaa = localFont ({ src: "../fonts/Comfortaa-VariableFont_wght.ttf" })

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
    <html lang="ru" data-theme="light" className="overflow-hidden">
      <body className={comfortaa.className}>
        <GraphEditorProvider>{children}</GraphEditorProvider>
      </body>
    </html>
  );
}

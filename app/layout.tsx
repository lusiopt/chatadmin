import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatAdmin - StreamChat Admin",
  description: "Interface administrativa para gerenciar canais e avisos do StreamChat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rack AR — Visualizá muebles en tu casa',
  description: 'MVP de Realidad Aumentada para e-commerce de racks.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

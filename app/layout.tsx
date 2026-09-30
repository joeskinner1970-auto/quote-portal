import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Auto Quote Portal',
  description: 'Private staff quotation portal',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

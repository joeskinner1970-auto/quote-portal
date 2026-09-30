import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "DreamLease", template: "%s | DreamLease" },
  description: "Private staff quotation portal.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body>{children}</body></html>;
}


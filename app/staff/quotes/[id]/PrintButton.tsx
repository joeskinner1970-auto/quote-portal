"use client";

export function PrintButton({ href }: { href: string }) {
  return (
    <button
      type="button"
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      Print
    </button>
  );
}


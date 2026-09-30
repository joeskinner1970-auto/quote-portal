"use client";

export function DeleteQuoteButton({ action, quoteReference }: { action: string; quoteReference: string }) {
  return <form action={action} method="post" onSubmit={event => {
    if (!window.confirm(`Delete quote ${quoteReference} and every revision? This cannot be undone.`)) event.preventDefault();
  }}><button className="deleteQuoteButton" type="submit">Delete quote</button></form>;
}

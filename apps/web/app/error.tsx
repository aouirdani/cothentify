"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-slate-600">{error?.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} className="mt-4 rounded border px-3 py-1 text-sm">Try again</button>
    </div>
  );
}


import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you’re looking for doesn’t exist or was moved.</p>
      <div className="mt-4">
        <Link href="/" className="text-blue-600 underline">Go back home</Link>
      </div>
    </div>
  );
}


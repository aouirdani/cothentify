export default function Footer() {
  return (
    <footer className="mt-12 border-t py-8 text-sm text-[var(--fg-muted)]">
      <div className="container flex flex-col items-center justify-between gap-3 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--fg)]">Cothentify</span>
          <span>© 2025</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="hover:underline">Home</a>
          <a href="/dashboard" className="hover:underline">Dashboard</a>
          <a href="/content" className="hover:underline">Content</a>
          <a href="/pricing" className="hover:underline">Pricing</a>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </div>
    </footer>
  );
}

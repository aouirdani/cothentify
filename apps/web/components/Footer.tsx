export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-white/60 py-8 text-sm text-slate-600">
      <div className="container flex flex-col items-center justify-between gap-3 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">Cothentify</span>
          <span>© 2025</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="hover:underline">Home</a>
          <a href="/dashboard" className="hover:underline">Dashboard</a>
          <a href="/ai-text-detection" className="hover:underline">AI Detection</a>
          <a href="/pricing" className="hover:underline">Pricing</a>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </div>
    </footer>
  );
}

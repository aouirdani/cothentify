export default function TrustBar() {
  return (
    <div className="container my-8">
      <div className="rounded-xl border bg-white/70 p-4 shadow-soft">
        <div className="grid items-center gap-4 text-center text-xs text-slate-500 md:grid-cols-6">
          <span>Trusted by teams</span>
          <div className="h-6 rounded bg-slate-100" />
          <div className="h-6 rounded bg-slate-100" />
          <div className="h-6 rounded bg-slate-100" />
          <div className="h-6 rounded bg-slate-100" />
          <div className="h-6 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}


export default function Home() {
  return (
    <main className="relative">
      <div className="absolute inset-0 -z-10 bg-brand-radial" />
      <section className="container py-20 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">#1 AI Authenticity & Optimization</p>
        <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">Boost content credibility <span className="bg-brand-gradient bg-clip-text text-transparent">without slowing down</span></h1>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">Detect AI text, humanize tone, and ship SEO-ready content in one place.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="/auth/signup" className="rounded-xl px-5 py-3 font-medium text-white bg-brand-gradient">Get started free</a>
          <a href="/pricing" className="rounded-xl px-5 py-3 font-medium bg-white/10 text-white hover:bg-white/15">See pricing</a>
        </div>
        <ul className="mt-6 flex items-center justify-center gap-4 text-slate-400 text-sm">
          <li>• No credit card required</li>
          <li>• 7-day trial</li>
          <li>• Cancel anytime</li>
        </ul>
        <div className="mt-10 card gradient-ring p-4">
          <div className="aspect-[16/9] w-full rounded-xl bg-black/40 border border-white/10 grid place-items-center text-slate-400">Demo video / screenshot</div>
        </div>
        <div className="mt-8 text-slate-400 text-sm">Trusted by creators & teams — ratings and logos here</div>
      </section>
      <section className="container grid gap-6 md:grid-cols-3 py-8">
        {[{ t: 'Detect AI with confidence', d: 'Multi-model checks, transparent scores.' }, { t: 'Humanize & rewrite', d: 'Fix tone, flow, and citation style.' }, { t: 'SEO & export', d: 'Metadata, links, and instant exports.' }].map((f) => (
          <div key={f.t} className="card p-6">
            <h3 className="text-xl font-semibold">{f.t}</h3>
            <p className="mt-2 text-slate-300">{f.d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

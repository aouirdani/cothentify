import type { Metadata } from 'next';
import Link from 'next/link';

const featureHighlights = [
  {
    title: 'Layered model ensemble',
    description: 'Cross-check every submission with multiple best-in-class detectors to minimize false positives and provide balanced scores.',
  },
  {
    title: 'Source fingerprinting',
    description: 'Blend lexical signals with stylometry and burstiness analysis to highlight which sections require human review.',
  },
  {
    title: 'Transparent scoring',
    description: 'Deliver confidence scores, supporting evidence, and remediation tips that content teams can act on immediately.',
  },
] as const;

const workflowSteps = [
  {
    title: 'Ingest content from any channel',
    description: 'Paste drafts, upload documents, or sync directly from your CMS and editorial queues.',
  },
  {
    title: 'Run deep AI provenance checks',
    description: 'Our ensemble runs in seconds, correlating language models, stylometric drift, and metadata fingerprints.',
  },
  {
    title: 'Decide and collaborate',
    description: 'Share findings, request rewrites, or auto-flag policies with audit trails that satisfy compliance teams.',
  },
] as const;

const trustSignals = [
  'Purpose-built for publishers, educators, and compliance teams',
  'SOC 2 ready infrastructure with regional processing controls',
  'Consistent updates to track emerging generative models',
] as const;

const faqs = [
  {
    question: 'How accurate is the detector?',
    answer:
      'Cothentify combines lexical, syntactic, and metadata analysis with a continually refreshed model ensemble. In internal benchmarks we maintain a 94% recall on popular LLM families while keeping false positives below 3%.',
  },
  {
    question: 'Can we integrate it with our workflow?',
    answer:
      'Yes. Use the dashboard for manual checks, connect your CMS via webhook, or call the REST API for automated screening before publication.',
  },
  {
    question: 'Does it store our content?',
    answer:
      'Detection jobs are encrypted in transit and at rest. You control retention windows and can opt out of persistent storage entirely.',
  },
] as const;

export const metadata: Metadata = {
  title: 'AI Text Detection | Cothentify',
  description:
    'Detect AI-generated writing with ensemble scoring, stylometric analysis, and transparent reporting tailored for editorial and compliance teams.',
};

export default function AiTextDetectionPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-brand-radial" />
      <section className="container grid gap-12 py-20 lg:grid-cols-[1.6fr,1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-slate-300">
            AI Text Detection
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Trust the words you publish and deliver
            <span className="bg-brand-gradient bg-clip-text text-transparent"> AI transparency at scale</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Cothentify helps your team understand when generative AI assisted the writing process, why we flagged a section, and how to remediate it without slowing shipping schedules.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/signup"
              className="rounded-2xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
            >
              Start detecting for free
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/80 hover:text-white"
            >
              View plans
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 text-sm text-slate-400 md:grid-cols-2">
            {trustSignals.map((signal) => (
              <li key={signal} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card gradient-ring relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.35),rgba(14,116,144,0.25))] opacity-60" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Live confidence score</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Every detection job returns a 0–100 score with supporting signals so reviewers instantly understand AI involvement.
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-slate-400">Content score</span>
                  <span className="text-lg font-semibold text-emerald-300">92 / 100 trusted</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Stylometry match</span>
                    <span className="text-slate-100">High</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>LLM phrase density</span>
                    <span className="text-amber-200">Moderate</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Source metadata</span>
                    <span className="text-slate-100">Verified</span>
                  </div>
                </div>
                <div className="mt-5 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  ✅ Suggested action: Publish with note. Request edits on section 3 for tone alignment.
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Ensemble model updates ship weekly so your scores track new releases from OpenAI, Anthropic, and beyond.
              </p>
            </div>
        </div>
      </section>

      <section className="container grid gap-6 pb-16 md:grid-cols-3">
        {featureHighlights.map((feature) => (
          <article key={feature.title} className="card p-6">
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="container pb-16">
        <div className="card grid gap-6 p-8 md:grid-cols-[1fr,1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold">How detection flows end-to-end</h2>
            <p className="mt-3 text-slate-300">
              Bring AI detection into the heart of your publishing workflow without interrupting editors or reviewers.
            </p>
          </div>
          <ol className="grid gap-4 text-sm text-slate-300">
            {workflowSteps.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Step {index + 1}</span>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                </div>
                <p className="mt-2 leading-relaxed text-slate-300">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((item) => (
            <article key={item.question} className="card p-6">
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <div className="card grid gap-6 p-8 text-center md:p-12">
          <h2 className="text-3xl font-semibold text-white">Ready to prove authenticity?</h2>
          <p className="mx-auto max-w-2xl text-slate-300">
            Launch Cothentify across your editorial, academic, or compliance teams and start detecting AI-generated writing in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/signup" className="rounded-2xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white">
              Get started
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/80 hover:text-white"
            >
              Explore plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

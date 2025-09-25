import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import TrustBar from '../components/TrustBar';
import Hero from '../components/hero/Hero';
import FeatureCards from '../components/hero/FeatureCards';

export const revalidate = 120;

export default function HomePage() {
  return (
    <div className="grid gap-10">
      {/* Hero (client island) */}
      <Hero>
        <div className="relative grid items-start gap-10">
          <div>
            <h1 className="text-gradient">Content authenticity, at scale</h1>
            <p className="mt-3 text-lg text-slate-600">Detect AI-generated text, orchestrate human workflows, and deliver transparent reports to clients — all in one place.</p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700">
              <li>• Ensemble AI detection with confidence</li>
              <li>• Human-in-the-loop content workflows</li>
              <li>• Client-ready authenticity reports</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <a href="/dashboard"><Button size="lg">Try the Detector</Button></a>
              <a href="/pricing"><Button size="lg" variant="secondary">View Pricing</Button></a>
            </div>
            <p className="mt-3 text-sm text-slate-500">No credit card required.</p>
          </div>
        </div>
      </Hero>
      <TrustBar />

      {/* Feature highlights */}
      <FeatureCards />

      {/* Health */}
      <Card>
        <CardHeader title="Web Health" subtitle="Check the Next.js API health route." />
        <a className="text-blue-600 underline" href="/api/health" target="_blank" rel="noreferrer">
          Open web health route
        </a>
      </Card>
    </div>
  );
}

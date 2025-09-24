"use client";

import { motion } from 'framer-motion';
import { Card, CardHeader } from '../../components/ui/card';

export default function FeatureCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} viewport={{ once: true }}>
        <Card>
          <CardHeader title="Accurate AI detection" subtitle="Multi-provider signals with ensemble scoring." />
          <p className="text-sm text-slate-600">Cross-check content with multiple models and heuristics for robust AI probability estimates.</p>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} viewport={{ once: true }}>
        <Card>
          <CardHeader title="Workflow automation" subtitle="Assign, review, approve — with SLAs." />
          <p className="text-sm text-slate-600">Streamline human-in-the-loop creation, versioning, and approvals with auditable trails.</p>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}>
        <Card>
          <CardHeader title="Client-ready reports" subtitle="Share branded, verifiable results." />
          <p className="text-sm text-slate-600">Export authenticity certificates and dashboards to keep stakeholders aligned.</p>
        </Card>
      </motion.div>
    </div>
  );
}


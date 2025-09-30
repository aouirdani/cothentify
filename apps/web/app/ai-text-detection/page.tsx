import type { Metadata } from 'next';
import AiTextDetectionClient from './AiTextDetectionClient';

export const metadata: Metadata = {
  title: 'AI Text Detection | Cothentify',
  description: 'Paste a sample, run the Cothentify detector, and get instant humanizing tips to ship authentic writing.',
};

export default function AiTextDetectionPage() {
  return <AiTextDetectionClient />;
}

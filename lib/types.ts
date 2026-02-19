export type Visibility = 'public' | 'pro' | 'private';
export type SignalClassification = 'Structural Trigger' | 'Early Intervention / Quiet Signal';
export type FollowUpStatus = 'open' | 'in_progress' | 'resolved' | 'not_actionable';

export interface ParsedSignal {
  companyName: string;
  sponsorName: string;
  headline: string;
  signalDetected: boolean;
  classification: SignalClassification;
  primaryTriggerCategory: string;
  secondaryTriggers?: string;
  confidenceScore: number;
  meritsOutreach: boolean;
  outreachReasoning?: string;
  potentialForTransformation?: string;
  evidenceBullets: string[];
  sourceRefs: number[];
}

export interface ParsedReport {
  title: string;
  reportDate: string;
  overviewBullets: string[];
  signalMix: Array<{ triggerType: string; count: number }>;
  signals: ParsedSignal[];
  recommendedOutreach: Array<{
    companyName: string;
    sponsorName: string;
    triggerType: string;
    confidenceScore: number;
  }>;
  notesAndObservations: string[];
  sources: Array<{
    refNumber: number;
    title: string;
    url: string;
    domain: string;
  }>;
  warnings: string[];
}

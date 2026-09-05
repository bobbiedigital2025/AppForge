'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react';

interface TermsGateProps {
  onAccept: () => void;
}

export function TermsGate({ onAccept }: TermsGateProps) {
  const [agreed, setAgreed] = useState(false);
  const [understoodKeys, setUnderstoodKeys] = useState(false);

  const canProceed = agreed && understoodKeys;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Before You Build
          </CardTitle>
          <p className="text-sm text-white/50 mt-1">
            Please read and accept before creating your first project.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Keys Section */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Key className="w-4 h-4 text-yellow-400" />
              API Keys Required
            </h3>
            <p className="text-sm text-white/60">
              AppForge uses AI and database services that require API keys. You'll need to:
            </p>
            <ul className="text-sm text-white/60 space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">1.</span>
                Get a Telnyx API key (powers the AI agents)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">2.</span>
                Create a Supabase project (stores your data)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">3.</span>
                Add these keys to your environment variables
              </li>
            </ul>
            <p className="text-xs text-white/40">
              Our <a href="/setup" className="text-violet-400 hover:underline">Setup Guide</a> walks you through each step.
            </p>
          </div>

          {/* Preview Terms */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Free Tier Terms
            </h3>
            <ul className="text-sm text-white/60 space-y-2">
              <li>Your app will be deployed as a <strong>live preview</strong> for 7 days</li>
              <li>After 7 days, the preview goes offline unless you upgrade</li>
              <li>Source code export is available on paid plans only</li>
              <li>Free tier includes "Built with AppForge" branding</li>
            </ul>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setUnderstoodKeys(!understoodKeys)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                understoodKeys ? 'bg-violet-500 border-violet-500' : 'border-white/30'
              }`}>
                {understoodKeys && <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="text-sm text-white/70">
                I understand I need to provide my own API keys for AI and database services, and that these are separate from AppForge's pricing.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAgreed(!agreed)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                agreed ? 'bg-violet-500 border-violet-500' : 'border-white/30'
              }`}>
                {agreed && <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="text-sm text-white/70">
                I agree to the <a href="/terms" className="text-violet-400 hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and <a href="/privacy" className="text-violet-400 hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>, and understand the free tier preview expires after 7 days.
              </span>
            </label>
          </div>

          {/* CTA */}
          <Button
            variant="gradient"
            className="w-full"
            disabled={!canProceed}
            onClick={onAccept}
          >
            {canProceed ? "Let's Build" : 'Please accept both to continue'}
          </Button>

          <p className="text-xs text-white/30 text-center">
            Need help getting your API keys? <a href="/setup" className="text-violet-400 hover:underline">Check the Setup Guide</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

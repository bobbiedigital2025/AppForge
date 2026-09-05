'use client';

import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown, Building2 } from 'lucide-react';

interface TierBadgeProps {
  tier: string;
  showIcon?: boolean;
}

const tierConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  free: {
    icon: <Sparkles className="w-3 h-3" />,
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    label: 'Free',
  },
  starter: {
    icon: <Zap className="w-3 h-3" />,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    label: 'Starter',
  },
  pro: {
    icon: <Crown className="w-3 h-3" />,
    color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    label: 'Pro',
  },
  enterprise: {
    icon: <Building2 className="w-3 h-3" />,
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    label: 'Enterprise',
  },
};

export function TierBadge({ tier, showIcon = true }: TierBadgeProps) {
  const config = tierConfig[tier] || tierConfig.free;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}

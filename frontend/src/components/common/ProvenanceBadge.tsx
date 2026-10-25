import React from 'react';
import { ProvenanceType } from '../../types';
import { ShieldCheck, Database, History, FlaskConical, AlertCircle } from 'lucide-react';

interface Props {
  provenance?: ProvenanceType;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const ProvenanceBadge: React.FC<Props> = ({ provenance = 'SAMPLE', showIcon = true, size = 'sm' }) => {
  const styles: Record<ProvenanceType, { bg: string; text: string; border: string; dot: string; label: string; icon: any }> = {
    LIVE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Live Feed',
      icon: ShieldCheck,
    },
    CACHED: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Cached',
      icon: Database,
    },
    HISTORICAL: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
      label: 'Historical',
      icon: History,
    },
    SAMPLE: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Certified Sample',
      icon: FlaskConical,
    },
    UNAVAILABLE: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'Unavailable',
      icon: AlertCircle,
    },
  };

  const style = styles[provenance] || styles.SAMPLE;
  const Icon = style.icon;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClass} tracking-normal select-none`}
      title={`Data Provenance: ${style.label} - Tracked with verifiable observation audit`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />}
      <span>{style.label}</span>
    </span>
  );
};

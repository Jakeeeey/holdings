import React from 'react';
import { LucideIcon } from 'lucide-react';

interface LogisticsKPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass?: string;
  className?: string;
}

export function LogisticsKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColorClass,
  iconBgClass = "bg-white/5",
  className = "",
}: LogisticsKPICardProps) {
  return (
    <div className={`bg-[#111113] border border-white/5 rounded-xl p-6 flex items-start justify-between ${className}`}>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
          {title}
        </p>
        <h3 className="text-[28px] font-bold text-white mb-2 leading-none">
          {value}
        </h3>
        <p className="text-xs text-slate-400 font-medium">
          {subtitle}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${iconBgClass} ${iconColorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

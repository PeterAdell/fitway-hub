import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  color: "emerald" | "blue" | "amber" | "rose";
  trend?: string;
}

export function StatCard({ title, value, unit, icon: Icon, color, trend }: StatCardProps) {
  const colorStyles = {
    emerald: "bg-emerald-500/20 text-emerald-300",
    blue: "bg-blue-500/20 text-blue-300",
    amber: "bg-amber-500/20 text-amber-300",
    rose: "bg-rose-500/20 text-rose-300",
  };

  return (
    <div className="backdrop-blur-md bg-white/10 p-4 rounded-2xl border border-white/20 hover:border-white/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/70">{title}</span>
        <div className={cn("p-2 rounded-lg", colorStyles[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-white/60 mb-1">{unit}</span>}
      </div>
      {trend && (
        <p className="text-xs text-emerald-300 font-medium mt-2 flex items-center gap-1">
          {trend}
        </p>
      )}
    </div>
  );
}

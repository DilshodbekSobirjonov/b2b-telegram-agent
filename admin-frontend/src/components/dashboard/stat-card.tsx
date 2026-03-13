import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
}

export function StatCard({ title, value, trend, trendUp, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-gradient-primary shadow-md flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        {trend && (
          <p className={cn("text-sm mt-1 flex items-center gap-1 font-medium", trendUp ? "text-emerald-500" : "text-rose-500")}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor?: string;
  className?: string;
}

export function StatsCard({ title, value, icon, bgColor = "bg-blue-50", className }: StatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("rounded-xl p-3 shrink-0", bgColor)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

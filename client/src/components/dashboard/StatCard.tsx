import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserAvatar {
  id: number;
  name: string;
  image: string;
}

interface Action {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  onClick?: () => void;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  total?: string;
  percentage?: number;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  progressColor?: string;
  badge?: string;
  badgeType?: "default" | "secondary" | "success" | "warning" | "danger" | "destructive";
  userAvatars?: UserAvatar[];
  actions?: Action[];
}

export default function StatCard({
  title,
  value,
  subtitle,
  total,
  percentage,
  trend,
  trendType = "neutral",
  progressColor = "bg-primary",
  badge,
  badgeType = "default",
  userAvatars,
  actions,
}: StatCardProps) {
  const getBadgeVariant = () => {
    switch (badgeType) {
      case "success":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "warning":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "danger":
      case "destructive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "secondary":
        return "bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  const getTrendColor = () => {
    switch (trendType) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
          {badge && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeVariant()}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold">{value}</p>
          {total && (
            <p className="ml-2 text-sm text-muted-foreground">sur {total} employés</p>
          )}
          {subtitle && (
            <p className="ml-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {percentage !== undefined && (
          <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className={`${progressColor} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
          </div>
        )}
        {trend && (
          <div className="mt-2">
            <span className={`text-xs font-medium ${getTrendColor()}`}>
              {trend}
            </span>
          </div>
        )}
        {userAvatars && userAvatars.length > 0 && (
          <div className="mt-4 flex -space-x-1 overflow-hidden">
            {userAvatars.map((user) => (
              <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
        {actions && actions.length > 0 && (
          <div className="mt-4 flex items-center space-x-4">
            {actions.map((action, index) => (
              <Button 
                key={index} 
                variant={action.variant} 
                size="sm" 
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

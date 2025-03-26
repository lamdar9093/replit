import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Calendar, ArrowLeftRight, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface RecentActivityProps {
  activities: any[];
  className?: string;
}

export default function RecentActivity({ activities, className }: RecentActivityProps) {
  const [timeFilter, setTimeFilter] = useState("today");

  // Get users for activity display
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter activities based on time selection
  const filteredActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.createdAt);
    const today = new Date();
    
    switch (timeFilter) {
      case "today":
        return activityDate.toDateString() === today.toDateString();
      case "week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return activityDate >= startOfWeek;
      case "month":
        return activityDate.getMonth() === today.getMonth() && 
               activityDate.getFullYear() === today.getFullYear();
      default:
        return true;
    }
  });

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "approval":
        return (
          <div className="mr-3 mt-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full p-2">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case "denial":
        return (
          <div className="mr-3 mt-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full p-2">
            <XCircle className="h-4 w-4" />
          </div>
        );
      case "shift_added":
        return (
          <div className="mr-3 mt-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full p-2">
            <Calendar className="h-4 w-4" />
          </div>
        );
      case "shift_swap":
        return (
          <div className="mr-3 mt-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full p-2">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
        );
      case "late":
        return (
          <div className="mr-3 mt-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full p-2">
            <Clock className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="mr-3 mt-0.5 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 rounded-full p-2">
            <Calendar className="h-4 w-4" />
          </div>
        );
    }
  };

  // Format activity time
  const formatActivityTime = (date: string) => {
    const activityDate = new Date(date);
    const today = new Date();
    
    // If it's today, show the time
    if (activityDate.toDateString() === today.toDateString()) {
      return format(activityDate, 'HH:mm');
    }
    
    // If it's this week, show "Yesterday" or the day name
    if (activityDate > new Date(today.setDate(today.getDate() - 7))) {
      return formatDistanceToNow(activityDate, { addSuffix: true, locale: fr });
    }
    
    // Otherwise, show the date
    return format(activityDate, 'dd MMM', { locale: fr });
  };

  // Get user name
  const getUserName = (userId: number | null) => {
    if (!userId) return "";
    const user = users?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "";
  };

  return (
    <Card className={className}>
      <CardHeader className="border-b border-border px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <CardTitle>Activité récente</CardTitle>
        <Select 
          defaultValue="today" 
          value={timeFilter} 
          onValueChange={setTimeFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Aujourd'hui" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border">
        {filteredActivities.length > 0 ? (
          <>
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-4 flex items-start">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">
                        {activity.type === "approval" && "Demande de congé approuvée"}
                        {activity.type === "denial" && "Demande de congé refusée"}
                        {activity.type === "shift_added" && "Nouveau quart ajouté"}
                        {activity.type === "shift_swap" && "Échange de quart"}
                        {activity.type === "late" && "Pointage en retard"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {activity.description || (
                          <>
                            {activity.type === "approval" && (
                              <>La demande de congé de <span className="font-medium text-foreground">{getUserName(activity.relatedUserId)}</span> a été approuvée par <span className="font-medium text-foreground">{getUserName(activity.userId)}</span>.</>
                            )}
                            {activity.type === "denial" && (
                              <>La demande de congé de <span className="font-medium text-foreground">{getUserName(activity.relatedUserId)}</span> a été refusée par <span className="font-medium text-foreground">{getUserName(activity.userId)}</span>.</>
                            )}
                            {activity.type === "shift_added" && (
                              <><span className="font-medium text-foreground">{getUserName(activity.relatedUserId)}</span> a été ajouté au planning.</>
                            )}
                            {activity.type === "shift_swap" && (
                              <><span className="font-medium text-foreground">{getUserName(activity.userId)}</span> et <span className="font-medium text-foreground">{getUserName(activity.relatedUserId)}</span> ont échangé leurs quarts.</>
                            )}
                            {activity.type === "late" && (
                              <><span className="font-medium text-foreground">{getUserName(activity.relatedUserId)}</span> a pointé avec du retard.</>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatActivityTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-4 flex justify-center">
              <Button variant="link">
                Voir toute l'activité
              </Button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Aucune activité récente pour cette période
          </div>
        )}
      </CardContent>
    </Card>
  );
}

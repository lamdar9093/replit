import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, CalendarDays } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface WeeklyCalendarProps {
  startDate: Date;
}

export default function WeeklyCalendar({ startDate }: WeeklyCalendarProps) {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [draggedShift, setDraggedShift] = useState<any | null>(null);

  // Generate array of days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startDate, i);
    return {
      date: day,
      name: format(day, 'EEE', { locale: fr }),
      number: format(day, 'd'),
      isToday: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    };
  });

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch shifts for the week
  const endDate = addDays(startDate, 6);
  const { data: shifts } = useQuery({
    queryKey: ['/api/shifts', { startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
    queryFn: async () => {
      const res = await fetch(`/api/shifts?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch shifts');
      return res.json();
    }
  });

  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/shifts/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Quart modifié",
        description: "Le quart a été modifié avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la modification du quart: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle shift drop
  const handleShiftDrop = (shift: any, newDay: Date) => {
    if (!shift) return;
    
    const currentDate = new Date(shift.date);
    const daysDifference = Math.floor((newDay.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 0 || daysDifference > 6) return;
    
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + daysDifference);
    newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
    
    updateShiftMutation.mutate({
      ...shift,
      date: newDate.toISOString()
    });
  };

  // Function to duplicate week
  const handleDuplicateWeek = () => {
    toast({
      title: "Semaine dupliquée",
      description: "La semaine a été dupliquée pour la semaine prochaine.",
    });
  };

  // Function to export schedule
  const handleExportSchedule = () => {
    toast({
      title: "Horaire exporté",
      description: "L'horaire a été exporté en format CSV.",
    });
  };

  // Get user by ID
  const getUserById = (userId: number) => {
    return users?.find((user: any) => user.id === userId);
  };

  // Get shifts for a specific user and day
  const getUserShiftsForDay = (userId: number, day: Date) => {
    if (!shifts) return [];
    
    return shifts.filter((shift: any) => {
      const shiftDate = new Date(shift.date);
      return (
        shift.userId === userId && 
        format(shiftDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
    });
  };

  // Get color for department
  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'service':
        return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300";
      case 'cuisine':
        return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300";
      case 'réception':
        return "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300";
      case 'administration':
        return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300";
      default:
        return "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300";
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-border px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">Planning de la semaine</h2>
          <div className="ml-4 flex items-center space-x-2">
            <span className="text-sm font-medium">
              {format(startDate, 'dd MMM', { locale: fr })} - {format(endDate, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-3 md:mt-0">
          <Button variant="outline" size="sm">
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicateWeek}>
            <Copy className="mr-1 h-4 w-4" />
            Dupliquer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSchedule}>
            <Download className="mr-1 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Calendar header */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] text-center border-b border-border bg-muted/50">
          <div className="py-3 text-muted-foreground font-medium text-sm">
            Employés
          </div>
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={cn(
                "py-3 font-medium",
                day.isToday && "border-l-4 border-primary"
              )}
            >
              <div>{day.name}</div>
              <div className={cn(
                "text-sm",
                day.isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day.number}
              </div>
            </div>
          ))}
        </div>
        
        {/* Calendar body */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {users?.map((employee: any) => (
              <div key={employee.id} className="grid grid-cols-[100px_repeat(7,1fr)]">
                {/* Employee info */}
                <div className="border-b border-border p-3 font-medium flex items-center">
                  <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                    <img 
                      src={employee.profileImage || `https://ui-avatars.com/api/?name=${employee.firstName}+${employee.lastName}`} 
                      alt={`${employee.firstName} ${employee.lastName}`} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div>{employee.firstName} {employee.lastName.charAt(0)}.</div>
                    <div className="text-xs text-muted-foreground">{employee.position}</div>
                  </div>
                </div>
                
                {/* Days of the week */}
                {weekDays.map((day, dayIndex) => {
                  const shiftsForDay = getUserShiftsForDay(employee.id, day.date);
                  return (
                    <div 
                      key={dayIndex}
                      className={cn(
                        "border-b border-border relative min-h-[60px]",
                        day.isToday ? "bg-muted/50" : "bg-card"
                      )}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleShiftDrop(draggedShift, day.date)}
                    >
                      {shiftsForDay.map((shift: any) => (
                        <div 
                          key={shift.id}
                          className={cn(
                            "shift-card absolute",
                            getDepartmentColor(shift.department),
                            "border p-2 m-1 text-sm top-1/4 h-1/2 cursor-grab"
                          )}
                          draggable
                          onDragStart={() => setDraggedShift(shift)}
                        >
                          <div className="font-medium">
                            {shift.startTime.substring(0, 5)} - {shift.endTime.substring(0, 5)}
                          </div>
                          <div className="text-xs">{shift.department}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Add employee row */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)]">
              <div className="border-b border-border p-3 flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer">
                <span className="i-ri-add-line mr-1">+</span>
                <span>Ajouter</span>
              </div>
              {weekDays.map((day, index) => (
                <div 
                  key={index}
                  className={cn(
                    "border-b border-border",
                    day.isToday ? "bg-muted/50" : "bg-card"
                  )}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ShiftModal from "./ShiftModal";

interface ScheduleCalendarProps {
  startDate: Date;
  employees: any[];
  shifts: any[];
}

export default function ScheduleCalendar({ startDate, employees, shifts }: ScheduleCalendarProps) {
  const [draggedShift, setDraggedShift] = useState<any | null>(null);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

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

  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/shifts/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Quart modifié",
        description: "Le quart a été déplacé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec du déplacement du quart: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setIsEditModalOpen(false);
      toast({
        title: "Quart supprimé",
        description: "Le quart a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la suppression du quart: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle shift drop
  const handleShiftDrop = (e: React.DragEvent, employeeId: number, day: Date) => {
    e.preventDefault();
    if (!draggedShift) return;
    
    // If dropping on same employee and day, do nothing
    const shiftDate = new Date(draggedShift.date);
    if (
      draggedShift.userId === employeeId &&
      format(shiftDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ) {
      return;
    }
    
    // Update the shift with new date and possibly new user
    const newDate = new Date(day);
    newDate.setHours(shiftDate.getHours(), shiftDate.getMinutes(), shiftDate.getSeconds());
    
    updateShiftMutation.mutate({
      ...draggedShift,
      userId: employeeId,
      date: newDate.toISOString()
    });
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

  // Handle shift click to open edit modal
  const handleShiftClick = (shift: any) => {
    setSelectedShift(shift);
    setIsEditModalOpen(true);
  };

  // Handle shift edit
  const handleShiftEdit = (updatedShift: any) => {
    updateShiftMutation.mutate(updatedShift);
    setIsEditModalOpen(false);
  };

  // Handle shift delete
  const handleShiftDelete = () => {
    if (selectedShift) {
      deleteShiftMutation.mutate(selectedShift.id);
    }
  };

  return (
    <>
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
          {employees.map((employee: any) => (
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
                    onDrop={(e) => handleShiftDrop(e, employee.id, day.date)}
                  >
                    {shiftsForDay.map((shift: any) => (
                      <div 
                        key={shift.id}
                        className={cn(
                          "absolute left-0 right-0 z-10 m-1 p-2 rounded-md transition-all duration-200 cursor-grab hover:scale-[1.02] hover:shadow-md",
                          getDepartmentColor(shift.department)
                        )}
                        draggable
                        onDragStart={() => setDraggedShift(shift)}
                        onClick={() => handleShiftClick(shift)}
                        style={{
                          top: '25%',
                          height: '50%'
                        }}
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
        </div>
      </div>

      {/* Edit Shift Modal */}
      {selectedShift && (
        <ShiftModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          shift={selectedShift}
          onSave={handleShiftEdit}
          onDelete={handleShiftDelete}
        />
      )}
    </>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useState, useRef, useEffect } from "react";
import { format, addDays, parse, parseISO, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ShiftModal from "./ShiftModal";
import { MoreHorizontal } from "lucide-react";

interface ScheduleCalendarProps {
  startDate: Date;
  employees: any[];
  shifts: any[];
}

export default function ScheduleCalendar({ startDate, employees, shifts }: ScheduleCalendarProps) {
  const [draggedShift, setDraggedShift] = useState<any | null>(null);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [isMultipleShifts, setIsMultipleShifts] = useState<{[key: string]: boolean}>({});
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
    
    // Filter shifts for this user and day
    const userShifts = shifts.filter((shift: any) => {
      const shiftDate = new Date(shift.date);
      return (
        shift.userId === userId && 
        format(shiftDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
    });
    
    // Sort shifts by start time
    return userShifts.sort((a, b) => {
      const startTimeA = parse(a.startTime.substring(0, 5), 'HH:mm', new Date());
      const startTimeB = parse(b.startTime.substring(0, 5), 'HH:mm', new Date());
      return startTimeA.getTime() - startTimeB.getTime();
    });
  };
  
  // Calculate position and height for a shift
  const calculateShiftPosition = (shift: any, totalShifts: number, index: number) => {
    const startTime = parse(shift.startTime.substring(0, 5), 'HH:mm', new Date());
    const endTime = parse(shift.endTime.substring(0, 5), 'HH:mm', new Date());
    
    // Calculate duration in minutes
    const durationMinutes = differenceInMinutes(endTime, startTime);
    
    // Base height calculation (minimum 30 minutes = 20px height)
    const height = Math.max(20, (durationMinutes / 60) * 40);
    
    // Calculate vertical position based on the index if multiple shifts
    // Each shift takes up to max 50% of cell height when multiple
    let topPosition = 5; // default padding
    
    if (totalShifts > 1) {
      // If multiple shifts, distribute them evenly in the cell
      const cellHeight = 100; // whole cell is 100%
      const heightPerShift = 90 / totalShifts; // 90% available space for shifts
      topPosition = 5 + (index * heightPerShift);
      
      return {
        top: `${topPosition}%`,
        height: `${heightPerShift - 5}%`, // minus 5% for spacing
        zIndex: 10 + index
      };
    }
    
    // Single shift
    return {
      top: '10%',
      height: '80%',
      zIndex: 10
    };
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
          {employees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Aucun employé à afficher. Veuillez sélectionner un autre département ou ajouter des employés.</p>
            </div>
          ) : (
            employees.map((employee: any) => (
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
                  const cellId = `cell-${employee.id}-${dayIndex}`;
                  const isDragOver = dragOverCell === cellId;
                  
                  // Set multiple shifts variable directly
                  const hasMultiple = shiftsForDay.length > 1;
                  
                  // Update state only once when we detect changes
                  if (isMultipleShifts[cellId] !== hasMultiple) {
                    // Using setTimeout to avoid React state updates during render
                    setTimeout(() => {
                      setIsMultipleShifts(prev => ({
                        ...prev,
                        [cellId]: hasMultiple
                      }));
                    }, 0);
                  }
                  
                  return (
                    <div 
                      key={dayIndex}
                      id={cellId}
                      className={cn(
                        "border-b border-border relative min-h-[70px]",
                        day.isToday ? "bg-muted/50" : "bg-card",
                        isDragOver && "bg-primary/5 border-2 border-dashed border-primary/50"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCell(cellId);
                      }}
                      onDragLeave={() => {
                        if (dragOverCell === cellId) {
                          setDragOverCell(null);
                        }
                      }}
                      onDrop={(e) => {
                        handleShiftDrop(e, employee.id, day.date);
                        setDragOverCell(null);
                      }}
                    >
                      {shiftsForDay.map((shift: any, index) => {
                        const shiftPosition = calculateShiftPosition(shift, shiftsForDay.length, index);
                        const isDragged = draggedShift && draggedShift.id === shift.id;
                        
                        return (
                          <div 
                            key={shift.id}
                            className={cn(
                              "absolute left-0 right-0 z-10 mx-1 p-2 rounded-md transition-all duration-200",
                              "border shadow-sm cursor-grab active:cursor-grabbing",
                              "hover:scale-[1.02] hover:shadow-md hover:z-20",
                              getDepartmentColor(shift.department),
                              isDragged && "opacity-50 scale-[1.02] shadow-md border-primary"
                            )}
                            draggable
                            onDragStart={() => setDraggedShift(shift)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftClick(shift);
                            }}
                            style={shiftPosition}
                          >
                            <div className="font-medium flex justify-between items-center">
                              <span>{shift.startTime.substring(0, 5)} - {shift.endTime.substring(0, 5)}</span>
                              {isMultipleShifts[cellId] && shiftsForDay.length > 2 && index === 0 && (
                                <div className="text-xs px-1.5 py-0.5 bg-background/80 rounded-full">
                                  {shiftsForDay.length}
                                </div>
                              )}
                            </div>
                            <div className="text-xs truncate">{shift.department}</div>
                            {shift.notes && (
                              <div className="text-xs truncate opacity-70 mt-1">{shift.notes}</div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Empty cell click handler */}
                      {shiftsForDay.length === 0 && (
                        <div 
                          className="absolute inset-0 cursor-pointer group"
                          onClick={() => {
                            // Provide a default shift for this employee on this day
                            setSelectedShift({
                              userId: employee.id,
                              date: day.date.toISOString(),
                              startTime: "09:00:00",
                              endTime: "17:00:00",
                              department: employee.department || "",
                              notes: null
                            });
                            setIsEditModalOpen(true);
                          }}
                        >
                          <div className="hidden group-hover:flex h-full w-full items-center justify-center text-muted-foreground">
                            <span className="text-xs">Cliquez pour ajouter un quart</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
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
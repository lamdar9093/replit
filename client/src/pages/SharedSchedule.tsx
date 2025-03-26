import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Printer, Download, ArrowLeft } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SharedSchedule() {
  const [, navigate] = useLocation();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [department, setDepartment] = useState<string>("all");
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);

  // Parse URL parameters
  useEffect(() => {
    // Créer un objet URLSearchParams à partir de l'URL actuelle
    const searchParams = new URLSearchParams(window.location.search);
    
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const dept = searchParams.get('department') || "all";
    const notes = searchParams.get('notes') !== "false"; // default to true
    
    if (start) setStartDate(new Date(start));
    if (end) setEndDate(new Date(end));
    setDepartment(dept);
    setIncludeNotes(notes);
  }, []);

  // Format date range for display
  const formatDateRange = () => {
    if (!startDate || !endDate) return "Chargement...";
    
    const start = format(startDate, 'EEEE d MMMM', { locale: fr });
    const end = format(endDate, 'EEEE d MMMM yyyy', { locale: fr });
    return `${start} - ${end}`;
  };

  // Get employees based on department filter
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!startDate && !!endDate,
  });

  // Get shifts for date range
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: ['/api/shifts', { startDate: startDate?.toISOString(), endDate: endDate?.toISOString() }],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const res = await fetch(`/api/shifts?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch shifts');
      return res.json();
    },
    enabled: !!startDate && !!endDate,
  });

  // Filter employees by department
  const filteredEmployees = employees?.filter((employee: any) => {
    if (department === "all") return true;
    return employee.department === department;
  });

  // Group shifts by day and employee
  const shiftsByDayAndEmployee = () => {
    if (!startDate || !endDate || !shifts.length) return {};

    const days = 7; // week
    const result: Record<string, Record<number, any[]>> = {};
    
    // Initialize days
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      result[dateKey] = {};
      
      // Initialize employees for each day
      filteredEmployees.forEach((employee: any) => {
        result[dateKey][employee.id] = [];
      });
    }
    
    // Group shifts
    shifts.forEach((shift: any) => {
      const shiftDate = new Date(shift.date);
      const dateKey = format(shiftDate, 'yyyy-MM-dd');
      
      if (result[dateKey] && result[dateKey][shift.userId]) {
        result[dateKey][shift.userId].push(shift);
      }
    });
    
    return result;
  };

  // Print current page
  const handlePrint = () => {
    window.print();
  };

  // Export as CSV
  const handleExport = () => {
    if (!shifts.length) return;
    
    const headers = ["Employee", "Date", "Start Time", "End Time", "Department"];
    if (includeNotes) headers.push("Notes");
    
    let csvContent = headers.join(",") + "\n";
    
    shifts.forEach((shift: any) => {
      const employee = employees.find((e: any) => e.id === shift.userId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "Unknown";
      const date = format(new Date(shift.date), 'yyyy-MM-dd');
      const startTime = shift.startTime.substring(0, 5);
      const endTime = shift.endTime.substring(0, 5);
      
      let row = [
        employeeName,
        date,
        startTime,
        endTime,
        shift.department
      ];
      
      if (includeNotes) row.push(shift.notes || "");
      
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `schedule-${format(startDate as Date, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (isLoadingEmployees || isLoadingShifts || !startDate || !endDate) {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-[500px] w-full rounded-md" />
      </div>
    );
  }

  const groupedShifts = shiftsByDayAndEmployee();
  const daysOfWeek = Object.keys(groupedShifts);

  return (
    <div className="container py-6 print:py-2 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-heading font-bold">Horaire partagé</h1>
          <p className="text-muted-foreground">Semaine du {formatDateRange()}</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => navigate("/schedule")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Card className="mb-6 print:mb-2 print:border-none">
        <CardHeader className="print:py-2">
          <div className="flex items-center justify-between print:flex-col print:items-start">
            <div>
              <CardTitle className="flex items-center gap-2 print:text-base">
                <Calendar className="h-5 w-5 print:hidden" />
                Horaire de la semaine
              </CardTitle>
              <CardDescription className="print:text-xs">
                {department !== "all" ? `Département: ${department} • ` : ""}
                Semaine du {formatDateRange()}
              </CardDescription>
            </div>
            <div className="print:text-xs print:mt-1">
              Généré le {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 print:p-1 print:text-xs text-left">Employé</th>
                  {daysOfWeek.map(day => (
                    <th key={day} className="border p-2 print:p-1 print:text-xs text-center">
                      {format(new Date(day), 'EEEE d/MM', { locale: fr })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee: any) => (
                  <tr key={employee.id}>
                    <td className="border p-2 print:p-1 print:text-xs">
                      {employee.firstName} {employee.lastName}
                    </td>
                    {daysOfWeek.map(day => (
                      <td key={`${employee.id}-${day}`} className="border p-2 print:p-1 print:text-xs text-center">
                        {groupedShifts[day][employee.id]?.map((shift: any, index: number) => (
                          <div key={index} className="mb-1 last:mb-0">
                            <div className="font-medium">
                              {shift.startTime.substring(0, 5)} - {shift.endTime.substring(0, 5)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {shift.department}
                            </div>
                            {includeNotes && shift.notes && (
                              <div className="text-xs italic mt-1 text-muted-foreground">
                                {shift.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
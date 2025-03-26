import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight, CalendarPlus, Copy, Download } from "lucide-react";
import ScheduleCalendar from "@/components/schedule/ScheduleCalendar";
import ShiftModal from "@/components/schedule/ShiftModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const { toast } = useToast();
  
  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/shifts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Quart ajouté",
        description: "Le quart a été ajouté avec succès.",
      });
      setIsAddShiftModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de l'ajout du quart: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Calculate start of week (Monday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  
  // Calculate end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  // Format date range for display
  const startFormatted = startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const endFormatted = endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Get employees
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Get departments
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });

  // Get shifts for current week
  const { data: shifts = [] } = useQuery<any[]>({
    queryKey: ['/api/shifts', { startDate: startOfWeek.toISOString(), endDate: endOfWeek.toISOString() }],
    queryFn: async () => {
      const res = await fetch(`/api/shifts?startDate=${startOfWeek.toISOString()}&endDate=${endOfWeek.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch shifts');
      return res.json();
    }
  });

  // Navigate to previous week
  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Set to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter employees by department
  const filteredEmployees = employees?.filter((employee: any) => {
    if (filterDepartment === "all") return true;
    return employee.department === filterDepartment;
  });

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Planning des horaires</h1>
          <p className="text-muted-foreground">Gérez les horaires des employés</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button size="sm" onClick={() => setIsAddShiftModalOpen(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Ajouter un quart
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center">
            <CardTitle>Planning de la semaine</CardTitle>
            <div className="ml-4 flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={previousWeek} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{startFormatted} - {endFormatted}</span>
              <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="font-medium">Filtrer par département:</div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les départements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments?.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScheduleCalendar 
            startDate={startOfWeek} 
            employees={filteredEmployees || []} 
            shifts={shifts || []} 
          />
        </CardContent>
      </Card>

      {/* Add Shift Modal */}
      <ShiftModal 
        isOpen={isAddShiftModalOpen} 
        onClose={() => setIsAddShiftModalOpen(false)}
        onSave={(shiftData) => createShiftMutation.mutate(shiftData)}
      />
    </Layout>
  );
}

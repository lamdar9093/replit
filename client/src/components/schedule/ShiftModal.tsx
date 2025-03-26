import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Clock, Users, Briefcase, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: any;
  onSave?: (shift: any) => void;
  onDelete?: () => void;
}

export default function ShiftModal({ isOpen, onClose, shift, onSave, onDelete }: ShiftModalProps) {
  const isEditing = !!shift?.id;

  // State for form fields
  const [employeeId, setEmployeeId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [notifyEmployee, setNotifyEmployee] = useState<boolean>(true);
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch employees
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/departments'],
    enabled: isOpen,
  });

  // Set form values when editing
  useEffect(() => {
    if (shift) {
      setEmployeeId(shift.userId?.toString() || "");
      
      // Format date for input
      const shiftDate = new Date(shift.date);
      setDate(format(shiftDate, 'yyyy-MM-dd'));
      setSelectedDate(shiftDate);
      
      setStartTime(shift.startTime?.substring(0, 5) || "");
      setEndTime(shift.endTime?.substring(0, 5) || "");
      setDepartment(shift.department || "");
      setNotes(shift.notes || "");
      
      // Par défaut, on notifie l'employé lors d'une modification
      setNotifyEmployee(true);
    } else {
      // Default values for new shift
      setEmployeeId("");
      const today = new Date();
      setDate(format(today, 'yyyy-MM-dd'));
      setSelectedDate(today);
      setStartTime("09:00");
      setEndTime("17:00");
      setDepartment("");
      setNotes("");
      setNotifyEmployee(true);
    }
    
    // Reset errors when modal opens
    setErrors({});
  }, [shift, isOpen]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDate(format(date, 'yyyy-MM-dd'));
    }
  };

  // Quick date selection options
  const quickDateOptions = [
    { label: "Aujourd'hui", date: new Date() },
    { label: "Demain", date: addDays(new Date(), 1) },
    { label: "Après-demain", date: addDays(new Date(), 2) },
    { label: "+1 semaine", date: addDays(new Date(), 7) },
  ];

  // Validate form fields
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!employeeId) {
      newErrors.employeeId = "L'employé est requis";
    }
    
    if (!date) {
      newErrors.date = "La date est requise";
    }
    
    if (!startTime) {
      newErrors.startTime = "L'heure de début est requise";
    }
    
    if (!endTime) {
      newErrors.endTime = "L'heure de fin est requise";
    } else if (startTime >= endTime) {
      newErrors.endTime = "L'heure de fin doit être après l'heure de début";
    }
    
    if (!department) {
      newErrors.department = "Le département est requis";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle saving the shift
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    try {
      // S'assurer que la date est au bon format
      // Créer une date avec année, mois, jour uniquement (sans heure) pour éviter les problèmes de fuseau horaire
      const dateParts = date.split('-').map(part => parseInt(part));
      const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
      
      if (isNaN(formattedDate.getTime())) {
        throw new Error("Date invalide");
      }
      
      const shiftData = {
        ...(shift?.id ? { id: shift.id } : {}),
        userId: parseInt(employeeId),
        date: formattedDate.toISOString(),
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        department,
        notes,
        notifyEmployee
      };

      console.log("Données du quart à sauvegarder:", shiftData);

      if (onSave) {
        onSave(shiftData);
      }
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      setErrors(prev => ({
        ...prev,
        date: "Format de date invalide"
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier un quart de travail" : "Ajouter un quart de travail"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifiez les détails du quart de travail et envoyez une notification à l'employé si nécessaire." 
              : "Ajoutez un nouveau quart de travail et envoyez une notification à l'employé."}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="advanced">Options avancées</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 py-4">
            <div>
              <Label htmlFor="employee" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employé
                {errors.employeeId && (
                  <span className="text-xs text-destructive ml-2">
                    {errors.employeeId}
                  </span>
                )}
              </Label>
              <Select 
                value={employeeId} 
                onValueChange={setEmployeeId}
              >
                <SelectTrigger className={cn(errors.employeeId && "border-destructive")}>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date
                {errors.date && (
                  <span className="text-xs text-destructive ml-2">
                    {errors.date}
                  </span>
                )}
              </Label>
              <div className="flex flex-col space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                        errors.date && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
                      ) : (
                        "Sélectionner une date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickDateOptions.map((option, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDateSelect(option.date)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heure de début
                  {errors.startTime && (
                    <span className="text-xs text-destructive ml-2">
                      {errors.startTime}
                    </span>
                  )}
                </Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  className={cn(errors.startTime && "border-destructive")}
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heure de fin
                  {errors.endTime && (
                    <span className="text-xs text-destructive ml-2">
                      {errors.endTime}
                    </span>
                  )}
                </Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  className={cn(errors.endTime && "border-destructive")}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="department" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Département
                {errors.department && (
                  <span className="text-xs text-destructive ml-2">
                    {errors.department}
                  </span>
                )}
              </Label>
              <Select 
                value={department} 
                onValueChange={setDepartment}
              >
                <SelectTrigger className={cn(errors.department && "border-destructive")}>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 py-4">
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea 
                id="notes" 
                placeholder="Ajouter des notes ou instructions pour ce quart" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="h-20"
              />
            </div>
            
            {selectedDate && isWeekend(selectedDate) && (
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Quart en fin de semaine
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <CardDescription className="text-amber-700 dark:text-amber-400 text-sm">
                    Ce quart est prévu pendant le weekend. Assurez-vous que l'employé est disponible pour travailler ces jours-là.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
            
            <div className="flex flex-col gap-2">
              <Label>Notification</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notifyEmployee" 
                  checked={notifyEmployee}
                  onCheckedChange={(checked) => setNotifyEmployee(!!checked)}
                />
                <Label htmlFor="notifyEmployee" className="text-sm font-normal cursor-pointer">
                  Notifier l'employé de ce changement d'horaire
                </Label>
              </div>
              {notifyEmployee && (
                <p className="text-xs text-muted-foreground mt-1">
                  Un message sera envoyé à l'employé pour l'informer de ce nouveau quart de travail. 
                  Si configuré, un email sera également envoyé.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex-col sm:flex-row justify-between gap-2">
          <div>
            {isEditing && onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: any;
  onSave?: (shift: any) => void;
  onDelete?: () => void;
}

export default function ShiftModal({ isOpen, onClose, shift, onSave, onDelete }: ShiftModalProps) {
  const isEditing = !!shift;

  // State for form fields
  const [employeeId, setEmployeeId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Set form values when editing
  useEffect(() => {
    if (shift) {
      setEmployeeId(shift.userId.toString());
      
      // Format date for input
      const shiftDate = new Date(shift.date);
      setDate(format(shiftDate, 'yyyy-MM-dd'));
      
      setStartTime(shift.startTime.substring(0, 5));
      setEndTime(shift.endTime.substring(0, 5));
      setDepartment(shift.department);
      setNotes(shift.notes || "");
    } else {
      // Default values for new shift
      setEmployeeId("");
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setStartTime("09:00");
      setEndTime("17:00");
      setDepartment("");
      setNotes("");
    }
  }, [shift, isOpen]);

  // Handle saving the shift
  const handleSave = () => {
    if (!employeeId || !date || !startTime || !endTime || !department) {
      // Handle validation error
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const shiftData = {
      ...(shift ? { id: shift.id } : {}),
      userId: parseInt(employeeId),
      date: new Date(date).toISOString(),
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      department,
      notes
    };

    if (onSave) {
      onSave(shiftData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier un quart de travail" : "Ajouter un quart de travail"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="employee">Employé</Label>
            <Select 
              value={employeeId} 
              onValueChange={setEmployeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Heure de début</Label>
              <Input 
                id="startTime" 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
              />
            </div>
            <div>
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input 
                id="endTime" 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="department">Département</Label>
            <Select 
              value={department} 
              onValueChange={setDepartment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un département" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea 
              id="notes" 
              placeholder="Ajouter des notes ou instructions" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="h-20"
            />
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <div>
            {isEditing && onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

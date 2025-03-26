import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CalendarPlus, Check, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function TimeOff() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  // Fetch time-off requests
  const { data: timeOffRequests, isLoading } = useQuery({
    queryKey: ['/api/time-off'],
  });

  // Add time-off request mutation
  const addTimeOffMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate || !reason || !user) {
        throw new Error("Missing required fields");
      }
      return apiRequest("POST", "/api/time-off", {
        userId: user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-off'] });
      setIsAddModalOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
      toast({
        title: "Demande envoyée",
        description: "Votre demande de congé a été envoyée pour approbation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de l'envoi de la demande: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Approve time-off request mutation
  const approveTimeOffMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("POST", `/api/time-off/${id}/approve`, {
        reviewerId: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-off'] });
      toast({
        title: "Demande approuvée",
        description: "La demande de congé a été approuvée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de l'approbation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Deny time-off request mutation
  const denyTimeOffMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("POST", `/api/time-off/${id}/deny`, {
        reviewerId: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-off'] });
      toast({
        title: "Demande refusée",
        description: "La demande de congé a été refusée.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec du refus: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter time-off requests based on active tab
  const filteredRequests = timeOffRequests?.filter((request: any) => {
    if (activeTab === "all") return true;
    return request.status === activeTab;
  });

  // Get user details for each request
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!timeOffRequests,
  });

  // Get user name from ID
  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu';
  };

  // Get user avatar from ID
  const getUserAvatar = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user?.profileImage || `https://ui-avatars.com/api/?name=${getUserName(userId).replace(' ', '+')}`;
  };

  // Format date range for display
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      return format(startDate, 'dd MMMM yyyy', { locale: fr });
    }
    
    return `${format(startDate, 'dd')} - ${format(endDate, 'dd MMMM yyyy', { locale: fr })}`;
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approuvé</Badge>;
      case 'denied':
        return <Badge variant="destructive">Refusé</Badge>;
      case 'pending':
        return <Badge variant="warning">En attente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Gestion des absences et congés</h1>
          <p className="text-muted-foreground">Gérez les demandes de congés et les absences</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 md:mt-0">
          <CalendarPlus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle>Demandes de congés</CardTitle>
          <Tabs 
            defaultValue="pending" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="mt-2 sm:mt-0"
          >
            <TabsList>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="approved">Approuvées</TabsTrigger>
              <TabsTrigger value="denied">Refusées</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">Chargement des demandes...</div>
          ) : filteredRequests?.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request: any) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                        <img 
                          src={getUserAvatar(request.userId)} 
                          alt={getUserName(request.userId)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <h3 className="font-medium">{getUserName(request.userId)}</h3>
                          <div className="flex items-center mt-1 sm:mt-0">
                            {getStatusBadge(request.status)}
                            <span className="text-xs text-muted-foreground ml-2">
                              {request.createdAt ? new Date(request.createdAt).toLocaleDateString('fr-FR') : ''}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm mt-1">{formatDateRange(request.startDate, request.endDate)}</p>
                        <p className="text-sm text-muted-foreground mt-2">{request.reason}</p>
                        
                        {request.status === 'pending' && user?.role === 'manager' && (
                          <div className="flex mt-3 space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => approveTimeOffMutation.mutate(request.id)}
                              disabled={approveTimeOffMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => denyTimeOffMutation.mutate(request.id)}
                              disabled={denyTimeOffMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-4">
              Aucune demande trouvée dans cette catégorie
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Time Off Request Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle demande de congé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={fr}
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motif</Label>
              <Textarea
                id="reason"
                placeholder="Motif de la demande"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => addTimeOffMutation.mutate()}
              disabled={!startDate || !endDate || !reason || addTimeOffMutation.isPending}
            >
              {addTimeOffMutation.isPending ? 'Envoi en cours...' : 'Envoyer la demande'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

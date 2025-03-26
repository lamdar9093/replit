import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PendingRequestsProps {
  requests: any[];
  className?: string;
}

export default function PendingRequests({ requests, className }: PendingRequestsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get users for display
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
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
        description: "La demande a été approuvée avec succès.",
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
        description: "La demande a été refusée.",
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

  // Get user information by ID
  const getUserInfo = (userId: number) => {
    const userInfo = users?.find((u: any) => u.id === userId);
    return {
      name: userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : "Utilisateur inconnu",
      avatar: userInfo?.profileImage || `https://ui-avatars.com/api/?name=User`
    };
  };

  // Format time since request was created
  const getTimeSince = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'dd MMMM', { locale: fr });
    } else {
      return `${format(start, 'dd')}-${format(end, 'dd MMMM', { locale: fr })}`;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="border-b border-border px-4 py-4 flex items-center justify-between">
        <CardTitle>Demandes en attente</CardTitle>
        <Badge variant="warning" className="ml-2">
          {requests.filter(r => r.status === 'pending').length} nouvelles
        </Badge>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border">
        {requests.filter(r => r.status === 'pending').length > 0 ? (
          <>
            {requests
              .filter(request => request.status === 'pending')
              .map((request) => {
                const userInfo = getUserInfo(request.userId);
                return (
                  <div key={request.id} className="p-4 flex items-start">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                      <AvatarFallback>{userInfo.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{userInfo.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {getTimeSince(request.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1">
                        {request.reason.includes('échange') 
                          ? request.reason 
                          : `Demande de congé pour le ${formatDateRange(request.startDate, request.endDate)}`}
                      </p>
                      <div className="flex items-center space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => approveTimeOffMutation.mutate(request.id)}
                          disabled={approveTimeOffMutation.isPending}
                        >
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => denyTimeOffMutation.mutate(request.id)}
                          disabled={denyTimeOffMutation.isPending}
                        >
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            <div className="p-4 flex justify-center">
              <Button variant="link">
                Voir toutes les demandes
              </Button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Aucune demande en attente
          </div>
        )}
      </CardContent>
    </Card>
  );
}

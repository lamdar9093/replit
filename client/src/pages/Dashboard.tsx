import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/dashboard/StatCard";
import WeeklyCalendar from "@/components/dashboard/WeeklyCalendar";
import PendingRequests from "@/components/dashboard/PendingRequests";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useAuth } from "@/hooks/useAuth";
import { CalendarPlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ShiftModal from "@/components/schedule/ShiftModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);

  // Fetch users for stats
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch pending time-off requests
  const { data: pendingRequests } = useQuery({
    queryKey: ['/api/time-off', { status: 'pending' }],
    queryFn: async () => {
      const res = await fetch('/api/time-off?status=pending');
      if (!res.ok) throw new Error('Failed to fetch pending requests');
      return res.json();
    }
  });

  // Fetch recent activities 
  const { data: activities } = useQuery({
    queryKey: ['/api/activities', { limit: 5 }],
    queryFn: async () => {
      const res = await fetch('/api/activities?limit=5');
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    }
  });

  // Generate week dates
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1); // Get Monday of current week
  
  // Format date range for display
  const weekStart = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const weekEnd = new Date(monday);
  weekEnd.setDate(monday.getDate() + 6);
  const weekEndFormatted = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Aperçu de la semaine du {weekStart} au {weekEndFormatted}</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button size="sm" onClick={() => setIsAddShiftModalOpen(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Ajouter un quart
          </Button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Employés actifs"
          value="18"
          total="20"
          percentage={90}
          trend="+2 cette semaine"
          trendType="positive"
          progressColor="bg-emerald-500"
        />
        <StatCard 
          title="Heures planifiées"
          value="168h"
          subtitle="cette semaine"
          badge="240h total"
          percentage={70}
          progressColor="bg-primary"
        />
        <StatCard 
          title="Demandes de congés"
          value={pendingRequests?.length.toString() || "0"}
          subtitle="ce mois-ci"
          badge={`${pendingRequests?.length || 0} en attente`}
          badgeType={pendingRequests?.length ? "warning" : "success"}
          userAvatars={users?.slice(0, 3).map(u => ({ 
            id: u.id, 
            name: `${u.firstName} ${u.lastName}`, 
            image: u.profileImage 
          }))}
        />
        <StatCard 
          title="Messages non lus"
          value="8"
          subtitle="conversations"
          badge="12 nouveaux"
          badgeType="danger"
          actions={[
            { label: "Voir tout", variant: "link" },
            { label: "Marquer comme lu", variant: "secondary" }
          ]}
        />
      </div>
      
      {/* Weekly schedule */}
      <WeeklyCalendar startDate={monday} />
      
      {/* Bottom section - notices and employee activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <PendingRequests requests={pendingRequests || []} />
        <RecentActivity activities={activities || []} className="lg:col-span-2" />
      </div>

      {/* Add Shift Modal */}
      <ShiftModal 
        isOpen={isAddShiftModalOpen} 
        onClose={() => setIsAddShiftModalOpen(false)} 
      />
    </Layout>
  );
}

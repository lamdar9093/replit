import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import { 
  LayoutDashboard, 
  Calendar,
  Users,
  Clock,
  CalendarCheck,
  MessageSquare,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Navigation items
  const navItems = [
    { path: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { path: "/schedule", label: "Horaires", icon: Calendar },
    { path: "/employees", label: "Employés", icon: Users },
    { path: "/time-off", label: "Absences & Congés", icon: CalendarCheck },
    { path: "/messages", label: "Messagerie", icon: MessageSquare },
    { path: "/settings", label: "Paramètres", icon: Settings }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className={cn(
      "flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0",
      className
    )}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-heading font-bold text-primary">StaffSync</h1>
        {onClose ? (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <ThemeToggle />
        )}
      </div>
      
      {/* User profile */}
      <div className="p-4 border-b border-border flex items-center">
        <img 
          src={user?.profileImage || "https://ui-avatars.com/api/?name=User"} 
          alt="Profile" 
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-muted-foreground">{user?.position}</p>
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md mb-1 transition-colors",
                  "hover:bg-muted",
                  isActive && "text-primary bg-primary/10 border-l-4 border-primary"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          <span>Se déconnecter</span>
        </Button>
      </div>
    </aside>
  );
}

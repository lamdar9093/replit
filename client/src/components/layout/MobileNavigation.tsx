import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Calendar,
  Users,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNavigation() {
  const [location] = useLocation();

  // Navigation items for bottom nav
  const navItems = [
    { path: "/", label: "Accueil", icon: LayoutDashboard },
    { path: "/schedule", label: "Horaires", icon: Calendar },
    { path: "/employees", label: "Employés", icon: Users },
    { path: "/messages", label: "Messages", icon: MessageSquare },
    { path: "/settings", label: "Plus", icon: MoreHorizontal }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-40">
      {navItems.map((item) => {
        const isActive = location === item.path;
        const Icon = item.icon;
        
        return (
          <Link key={item.path} href={item.path}>
            <a className="flex flex-col items-center py-1 px-3">
              <Icon 
                className={cn(
                  "text-xl",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span 
                className={cn(
                  "text-xs mt-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </a>
          </Link>
        );
      })}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" />
      
      {/* Mobile sidebar (hidden by default) */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div 
            className="h-full w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar 
              className="md:hidden" 
              onClose={() => setIsMobileSidebarOpen(false)} 
            />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Top bar for mobile */}
        <div className="md:hidden border-b border-border bg-card p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-heading font-bold text-primary">StaffSync</h1>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user?.profileImage && (
              <img 
                src={user.profileImage} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
            )}
          </div>
        </div>
        
        {/* Page content */}
        <div className="p-4 md:p-6 space-y-6">
          {children}
        </div>
      </main>
      
      {/* Mobile bottom navigation */}
      <MobileNavigation />
    </div>
  );
}

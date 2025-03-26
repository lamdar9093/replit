import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/useAuth";

// Pages
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Schedule from "@/pages/Schedule";
import TimeOff from "@/pages/TimeOff";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={Dashboard} />
          <Route path="/employees" component={Employees} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/time-off" component={TimeOff} />
          <Route path="/messages" component={Messages} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

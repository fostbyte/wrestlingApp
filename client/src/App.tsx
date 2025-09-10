import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TeamSetup from "@/pages/team-setup";
import RosterManagement from "@/pages/roster-management";
import EmailManagement from "@/pages/email-management";
import CompetitionData from "@/pages/competition-data";
import NewsletterCreation from "@/pages/newsletter-creation";
import MessageHistory from "@/pages/message-history";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";

function ProtectedRoute({ component: Component, ...rest }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Route {...rest} component={Component} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/team-setup" component={TeamSetup} />
      <ProtectedRoute path="/roster" component={RosterManagement} />
      <ProtectedRoute path="/emails" component={EmailManagement} />
      <ProtectedRoute path="/competitions" component={CompetitionData} />
      <ProtectedRoute path="/newsletters" component={NewsletterCreation} />
      <ProtectedRoute path="/history" component={MessageHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

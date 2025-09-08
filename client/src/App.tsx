import { Switch, Route } from "wouter";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/team-setup" component={TeamSetup} />
          <Route path="/roster" component={RosterManagement} />
          <Route path="/emails" component={EmailManagement} />
          <Route path="/competitions" component={CompetitionData} />
          <Route path="/newsletters" component={NewsletterCreation} />
          <Route path="/history" component={MessageHistory} />
        </>
      )}
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

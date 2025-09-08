import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UploadModal from "@/components/upload-modal";
import NewsletterPreview from "@/components/newsletter-preview";
import { 
  Users, 
  Mail, 
  Newspaper, 
  Trophy, 
  Upload, 
  UserPlus, 
  MailPlus, 
  Palette, 
  Plus,
  Bell
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string>("");

  // Get user teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    enabled: isAuthenticated,
  });

  // Get team stats for the first team
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "stats"],
    enabled: !!currentTeamId,
  });

  // Set current team when teams load
  useEffect(() => {
    if (teams && teams.length > 0 && !currentTeamId) {
      setCurrentTeamId(teams[0].id);
    }
  }, [teams, currentTeamId]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || teamsLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-card border-r animate-pulse" />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Teams Found</CardTitle>
            <CardDescription>
              You need to set up a team first to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              onClick={() => window.location.href = '/team-setup'}
              data-testid="button-setup-team"
            >
              Set Up Your Team
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTeam = teams.find(t => t.id === currentTeamId) || teams[0];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentTeam={currentTeam} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back to {currentTeam.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowNewsletterModal(true)}
                className="flex items-center"
                data-testid="button-create-newsletter"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Newsletter
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Athletes</p>
                    <p className="text-2xl font-semibold text-foreground" data-testid="stat-athletes">
                      {statsLoading ? "..." : stats?.totalAthletes || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Email Subscribers</p>
                    <p className="text-2xl font-semibold text-foreground" data-testid="stat-emails">
                      {statsLoading ? "..." : stats?.emailSubscribers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Newspaper className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Newsletters Sent</p>
                    <p className="text-2xl font-semibold text-foreground" data-testid="stat-newsletters">
                      {statsLoading ? "..." : stats?.newslettersSent || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Season Record</p>
                    <p className="text-2xl font-semibold text-foreground" data-testid="stat-record">
                      {statsLoading ? "..." : stats?.seasonRecord || "0-0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for managing your team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setShowUploadModal(true)}
                    data-testid="button-upload-results"
                  >
                    <Upload className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Upload Results</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => window.location.href = '/roster'}
                    data-testid="button-add-athlete"
                  >
                    <UserPlus className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Add Athlete</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => window.location.href = '/emails'}
                    data-testid="button-manage-emails"
                  >
                    <MailPlus className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Manage Emails</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => window.location.href = '/team-setup'}
                    data-testid="button-team-branding"
                  >
                    <Palette className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Team Branding</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No recent activity to display
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)}
          teamId={currentTeamId}
        />
      )}
      
      {showNewsletterModal && (
        <NewsletterPreview 
          onClose={() => setShowNewsletterModal(false)}
          team={currentTeam}
        />
      )}
    </div>
  );
}

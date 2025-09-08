import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import NewsletterPreview from "@/components/newsletter-preview";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Newspaper, 
  Send, 
  Eye, 
  Zap, 
  User, 
  Mail, 
  Calendar,
  FileText,
  Settings
} from "lucide-react";

interface CustomNewsletterForm {
  subject: string;
  content: string;
}

export default function NewsletterCreation() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTeamId, setCurrentTeamId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [newsletterType, setNewsletterType] = useState<"ai" | "custom">("ai");
  const queryClient = useQueryClient();

  // Get user teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    enabled: isAuthenticated,
  });

  // Set current team when teams load
  useEffect(() => {
    if (teams && teams.length > 0 && !currentTeamId) {
      setCurrentTeamId(teams[0].id);
    }
  }, [teams, currentTeamId]);

  // Get team data
  const { data: athletes } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "athletes"],
    enabled: !!currentTeamId,
  });

  const { data: competitions } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "competitions"],
    enabled: !!currentTeamId,
  });

  const { data: emailCountData } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "email-count"],
    enabled: !!currentTeamId,
  });

  const currentTeam = teams?.find(t => t.id === currentTeamId) || teams?.[0];

  const form = useForm<CustomNewsletterForm>({
    defaultValues: {
      subject: "",
      content: "",
    },
  });

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

  const sendCustomNewsletterMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      // Create and send custom newsletter
      const newsletter = await apiRequest("POST", `/api/teams/${currentTeamId}/newsletters`, {
        subject: data.subject,
        teamMessage: data.content,
        athleteMessages: [],
      });
      
      await apiRequest("POST", `/api/newsletters/${newsletter.id}/send`, {});
      return newsletter;
    },
    onSuccess: () => {
      toast({
        title: "Newsletter Sent!",
        description: "Your custom newsletter has been sent successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "newsletters"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter",
        variant: "destructive",
      });
    },
  });

  const handleCustomSend = (data: CustomNewsletterForm) => {
    if (!data.subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a newsletter subject",
        variant: "destructive",
      });
      return;
    }

    if (!data.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter newsletter content",
        variant: "destructive",
      });
      return;
    }

    const emailCount = emailCountData?.count || 0;
    if (emailCount === 0) {
      toast({
        title: "No Email Addresses",
        description: "You need to add email addresses before sending newsletters.",
        variant: "destructive",
      });
      return;
    }

    sendCustomNewsletterMutation.mutate(data);
  };

  const emailCount = emailCountData?.count || 0;
  const recentCompetition = competitions?.[0];
  const athleteCount = athletes?.length || 0;

  if (isLoading || teamsLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-card border-r animate-pulse" />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentTeam={currentTeam} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Create Newsletter</h1>
            <p className="text-sm text-muted-foreground">
              Create and send newsletters to your team community
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Newsletter Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Newspaper className="mr-2 h-5 w-5" />
                  Newsletter Type
                </CardTitle>
                <CardDescription>
                  Choose how you want to create your newsletter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      newsletterType === "ai" 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setNewsletterType("ai")}
                  >
                    <CardContent className="p-6 text-center">
                      <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">AI-Powered Newsletter</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate personalized athlete messages and team updates automatically 
                        based on recent competition results
                      </p>
                      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                        <div>✓ Individual athlete highlights</div>
                        <div>✓ Team performance summary</div>
                        <div>✓ Professional formatting</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${
                      newsletterType === "custom" 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setNewsletterType("custom")}
                  >
                    <CardContent className="p-6 text-center">
                      <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Custom Newsletter</h3>
                      <p className="text-sm text-muted-foreground">
                        Write your own custom message and send it directly to 
                        your team's email list
                      </p>
                      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                        <div>✓ Full creative control</div>
                        <div>✓ Custom messaging</div>
                        <div>✓ Quick to send</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Email Subscribers</span>
                  </div>
                  <p className="text-2xl font-bold mt-1" data-testid="stat-email-count">
                    {emailCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Athletes</span>
                  </div>
                  <p className="text-2xl font-bold mt-1" data-testid="stat-athlete-count">
                    {athleteCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Competitions</span>
                  </div>
                  <p className="text-2xl font-bold mt-1" data-testid="stat-competition-count">
                    {competitions?.length || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Team Setup</span>
                  </div>
                  <Badge variant={currentTeam?.brandVoice ? "default" : "secondary"} className="mt-1">
                    {currentTeam?.brandVoice ? "Complete" : "Incomplete"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* AI Newsletter Section */}
            {newsletterType === "ai" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5" />
                    AI-Powered Newsletter
                  </CardTitle>
                  <CardDescription>
                    Generate personalized content based on your team's recent performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Prerequisites Check */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Requirements Check</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${emailCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">Email addresses ({emailCount} added)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${athleteCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">Athletes in roster ({athleteCount} added)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${recentCompetition ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm">
                          Recent competition data {recentCompetition ? '(Available)' : '(Optional)'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${currentTeam?.brandVoice ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm">
                          Team brand voice {currentTeam?.brandVoice ? '(Configured)' : '(Optional)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {recentCompetition && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">Latest Competition Data</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>{recentCompetition.name}</strong> - {new Date(recentCompetition.date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setShowPreview(true)}
                      disabled={emailCount === 0 || athleteCount === 0}
                      className="flex-1"
                      data-testid="button-preview-ai-newsletter"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview AI Newsletter
                    </Button>
                  </div>

                  {(emailCount === 0 || athleteCount === 0) && (
                    <div className="text-sm text-muted-foreground">
                      {emailCount === 0 && (
                        <p>• Add email addresses in <a href="/emails" className="text-primary hover:underline">Email Management</a></p>
                      )}
                      {athleteCount === 0 && (
                        <p>• Add athletes in <a href="/roster" className="text-primary hover:underline">Roster Management</a></p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Custom Newsletter Section */}
            {newsletterType === "custom" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Custom Newsletter
                  </CardTitle>
                  <CardDescription>
                    Write and send a custom message to your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(handleCustomSend)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Line *</Label>
                      <Input
                        id="subject"
                        {...form.register("subject")}
                        placeholder="e.g., Important Team Update"
                        data-testid="input-custom-subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Message Content *</Label>
                      <Textarea
                        id="content"
                        {...form.register("content")}
                        placeholder="Write your message here..."
                        className="min-h-[200px]"
                        data-testid="textarea-custom-content"
                      />
                      <p className="text-sm text-muted-foreground">
                        Your message will be sent with your team branding and formatting.
                      </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        data-testid="button-reset-custom"
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={sendCustomNewsletterMutation.isPending || emailCount === 0}
                        data-testid="button-send-custom"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sendCustomNewsletterMutation.isPending 
                          ? "Sending..." 
                          : `Send to ${emailCount} subscriber${emailCount !== 1 ? 's' : ''}`
                        }
                      </Button>
                    </div>

                    {emailCount === 0 && (
                      <div className="text-sm text-destructive">
                        You need to add email addresses before sending newsletters. 
                        Go to <a href="/emails" className="underline">Email Management</a> to add them.
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* AI Newsletter Preview Modal */}
      {showPreview && currentTeam && (
        <NewsletterPreview 
          onClose={() => setShowPreview(false)}
          team={currentTeam}
        />
      )}
    </div>
  );
}

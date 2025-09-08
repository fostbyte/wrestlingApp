import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAthleteEmailSchema } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Plus, Trash2, User, AlertCircle, Search } from "lucide-react";
import { z } from "zod";

const emailFormSchema = insertAthleteEmailSchema.omit({ athleteId: true }).extend({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

export default function EmailManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTeamId, setCurrentTeamId] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
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

  // Get athletes for current team
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "athletes"],
    enabled: !!currentTeamId,
  });

  // Get email count for team
  const { data: emailCountData } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "email-count"],
    enabled: !!currentTeamId,
  });

  const currentTeam = teams?.find(t => t.id === currentTeamId) || teams?.[0];

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
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

  const addEmailMutation = useMutation({
    mutationFn: async (data: { athleteId: string; email: string }) => {
      return await apiRequest("POST", `/api/athletes/${data.athleteId}/emails`, { email: data.email });
    },
    onSuccess: () => {
      toast({
        title: "Email Added!",
        description: "New email has been added to the athlete.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "email-count"] });
      setShowAddModal(false);
      setSelectedAthleteId("");
      form.reset();
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
        description: error.message || "Failed to add email",
        variant: "destructive",
      });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return await apiRequest("DELETE", `/api/emails/${emailId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Email Removed",
        description: "Email has been removed from the athlete.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "email-count"] });
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
        description: error.message || "Failed to remove email",
        variant: "destructive",
      });
    },
  });

  // Get emails for each athlete
  const athletesWithEmails = athletes?.map(athlete => {
    const { data: emails } = useQuery({
      queryKey: ["/api/athletes", athlete.id, "emails"],
      enabled: !!athlete.id,
    });
    return { ...athlete, emails: emails || [] };
  }) || [];

  const handleSubmit = (data: EmailFormData) => {
    if (!selectedAthleteId) {
      toast({
        title: "No Athlete Selected",
        description: "Please select an athlete to add the email to.",
        variant: "destructive",
      });
      return;
    }

    const emailCount = emailCountData?.count || 0;
    if (emailCount >= 256) {
      toast({
        title: "Email Limit Reached",
        description: "Your team has reached the maximum limit of 256 emails.",
        variant: "destructive",
      });
      return;
    }

    addEmailMutation.mutate({ athleteId: selectedAthleteId, email: data.email });
  };

  const filteredAthletes = athletesWithEmails.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.emails.some(email => email.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const emailCount = emailCountData?.count || 0;
  const emailsRemaining = 256 - emailCount;

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Email Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage email addresses for your team newsletter distribution
              </p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              disabled={emailCount >= 256}
              data-testid="button-add-email"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Email
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Email Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Emails</p>
                      <p className="text-2xl font-semibold text-foreground" data-testid="stat-total-emails">
                        {emailCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Athletes</p>
                      <p className="text-2xl font-semibold text-foreground" data-testid="stat-athletes">
                        {athletes?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-muted rounded-lg">
                      <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-semibold text-foreground" data-testid="stat-remaining">
                        {emailsRemaining}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search athletes or email addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-emails"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email Limit Warning */}
            {emailCount >= 240 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                    <p className="text-sm text-amber-800">
                      {emailCount >= 256 
                        ? "You have reached the maximum limit of 256 emails per team."
                        : `You are approaching the email limit. Only ${emailsRemaining} emails remaining.`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Athletes and Their Emails */}
            {athletesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32" />
                          <div className="h-3 bg-muted rounded w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAthletes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Athletes Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No athletes or emails match your search criteria."
                      : "You need to add athletes to your roster before managing emails."
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => window.location.href = '/roster'}
                      data-testid="button-manage-roster"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Manage Roster
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAthletes.map((athlete) => (
                  <Card key={athlete.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                            {athlete.profilePhotoUrl ? (
                              <img 
                                src={athlete.profilePhotoUrl}
                                alt={`${athlete.name} photo`}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <User className="h-6 w-6 text-secondary-foreground" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg" data-testid={`athlete-${athlete.id}-name`}>
                              {athlete.name}
                            </CardTitle>
                            <CardDescription>
                              {athlete.grade} • {athlete.weightClass}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" data-testid={`athlete-${athlete.id}-email-count`}>
                            {athlete.emails.length} email{athlete.emails.length !== 1 ? 's' : ''}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAthleteId(athlete.id);
                              setShowAddModal(true);
                            }}
                            disabled={emailCount >= 256}
                            data-testid={`button-add-email-${athlete.id}`}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Email
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {athlete.emails.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No email addresses added yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {athlete.emails.map((emailObj) => (
                            <div 
                              key={emailObj.id} 
                              className="flex items-center justify-between p-2 bg-muted/30 rounded border"
                            >
                              <span className="text-sm" data-testid={`email-${emailObj.id}`}>
                                {emailObj.email}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Are you sure you want to remove this email address?")) {
                                    deleteEmailMutation.mutate(emailObj.id);
                                  }
                                }}
                                data-testid={`button-delete-email-${emailObj.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Email Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Email Address</DialogTitle>
            <DialogDescription>
              Add a new email address for newsletter distribution
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="athlete">Select Athlete</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                data-testid="select-athlete"
              >
                <option value="">Choose an athlete...</option>
                {athletes?.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name} ({athlete.grade}, {athlete.weightClass})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="e.g., parent@example.com"
                data-testid="input-email-address"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedAthleteId("");
                  form.reset();
                }}
                data-testid="button-cancel-email"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addEmailMutation.isPending || !selectedAthleteId}
                data-testid="button-save-email"
              >
                {addEmailMutation.isPending ? "Adding..." : "Add Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

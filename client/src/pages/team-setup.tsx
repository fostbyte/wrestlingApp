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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Palette, Save } from "lucide-react";
import { z } from "zod";

const teamFormSchema = insertTeamSchema.extend({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

export default function TeamSetup() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTeamId, setCurrentTeamId] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
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

  const currentTeam = teams?.find(t => t.id === currentTeamId) || teams?.[0];

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      school: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      brandVoice: "",
      teamStoreUrl: "",
    },
  });

  // Update form when team data loads
  useEffect(() => {
    if (currentTeam) {
      form.reset({
        name: currentTeam.name || "",
        school: currentTeam.school || "",
        primaryColor: currentTeam.primaryColor || "#3B82F6",
        secondaryColor: currentTeam.secondaryColor || "#1E40AF",
        brandVoice: currentTeam.brandVoice || "",
        teamStoreUrl: currentTeam.teamStoreUrl || "",
      });
    }
  }, [currentTeam, form]);

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

  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      return await apiRequest("POST", "/api/teams", data);
    },
    onSuccess: (newTeam) => {
      toast({
        title: "Team Created!",
        description: "Your wrestling team has been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setCurrentTeamId(newTeam.id);
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
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      return await apiRequest("PUT", `/api/teams/${currentTeamId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Team Updated!",
        description: "Your team settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
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
        description: error.message || "Failed to update team",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const response = await fetch(`/api/teams/${currentTeamId}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logo Uploaded!",
        description: "Your team logo has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setLogoFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TeamFormData) => {
    if (currentTeam) {
      updateTeamMutation.mutate(data);
    } else {
      createTeamMutation.mutate(data);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile && currentTeamId) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

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
            <h1 className="text-2xl font-semibold text-foreground">Team Setup</h1>
            <p className="text-sm text-muted-foreground">
              Configure your team information and branding
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Team Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Team Logo
                </CardTitle>
                <CardDescription>
                  Upload your team logo (JPG, PNG, max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                    {currentTeam?.logoUrl ? (
                      <img 
                        src={currentTeam.logoUrl} 
                        alt="Team logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="text-sm"
                      data-testid="input-logo"
                    />
                    {logoFile && (
                      <Button
                        onClick={handleLogoUpload}
                        disabled={uploadLogoMutation.isPending}
                        size="sm"
                        data-testid="button-upload-logo"
                      >
                        {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Information */}
            <Card>
              <CardHeader>
                <CardTitle>Team Information</CardTitle>
                <CardDescription>
                  Basic information about your wrestling team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Team Name *</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="e.g., Thunder Hawks Wrestling"
                        data-testid="input-team-name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="school">School Name *</Label>
                      <Input
                        id="school"
                        {...form.register("school")}
                        placeholder="e.g., Lincoln High School"
                        data-testid="input-school-name"
                      />
                      {form.formState.errors.school && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.school.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamStoreUrl">Team Store URL (Optional)</Label>
                    <Input
                      id="teamStoreUrl"
                      {...form.register("teamStoreUrl")}
                      placeholder="https://your-team-store.com"
                      data-testid="input-store-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandVoice">Brand Voice / Description</Label>
                    <Textarea
                      id="brandVoice"
                      {...form.register("brandVoice")}
                      placeholder="Describe your team's personality and communication style for AI message generation..."
                      className="min-h-[100px]"
                      data-testid="textarea-brand-voice"
                    />
                    <p className="text-sm text-muted-foreground">
                      This helps our AI generate messages that match your team's tone and style.
                    </p>
                  </div>

                  {/* Team Colors */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Palette className="mr-2 h-5 w-5" />
                      <h3 className="text-lg font-medium">Team Colors</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            {...form.register("primaryColor")}
                            className="w-20 h-10"
                            data-testid="input-primary-color"
                          />
                          <Input
                            {...form.register("primaryColor")}
                            placeholder="#3B82F6"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            {...form.register("secondaryColor")}
                            className="w-20 h-10"
                            data-testid="input-secondary-color"
                          />
                          <Input
                            {...form.register("secondaryColor")}
                            placeholder="#1E40AF"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                      data-testid="button-save-team"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {createTeamMutation.isPending || updateTeamMutation.isPending
                        ? "Saving..."
                        : currentTeam
                        ? "Update Team"
                        : "Create Team"
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

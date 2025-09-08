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
import { insertAthleteSchema } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Edit2, Trash2, Upload, User, Plus, Search } from "lucide-react";
import { z } from "zod";

const athleteFormSchema = insertAthleteSchema.omit({ teamId: true });
type AthleteFormData = z.infer<typeof athleteFormSchema>;

export default function RosterManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTeamId, setCurrentTeamId] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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

  const currentTeam = teams?.find(t => t.id === currentTeamId) || teams?.[0];

  const form = useForm<AthleteFormData>({
    resolver: zodResolver(athleteFormSchema),
    defaultValues: {
      name: "",
      grade: "",
      weightClass: "",
      profilePhotoUrl: "",
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

  const createAthleteMutation = useMutation({
    mutationFn: async (data: AthleteFormData) => {
      return await apiRequest("POST", `/api/teams/${currentTeamId}/athletes`, data);
    },
    onSuccess: () => {
      toast({
        title: "Athlete Added!",
        description: "New athlete has been added to your roster.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "athletes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "stats"] });
      setShowAddModal(false);
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
        description: error.message || "Failed to add athlete",
        variant: "destructive",
      });
    },
  });

  const updateAthleteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AthleteFormData> }) => {
      return await apiRequest("PUT", `/api/athletes/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Athlete Updated!",
        description: "Athlete information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "athletes"] });
      setEditingAthlete(null);
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
        description: error.message || "Failed to update athlete",
        variant: "destructive",
      });
    },
  });

  const deleteAthleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/athletes/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Athlete Removed",
        description: "Athlete has been removed from your roster.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "athletes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "stats"] });
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
        description: error.message || "Failed to remove athlete",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ athleteId, file }: { athleteId: string; file: File }) => {
      const formData = new FormData();
      formData.append("photo", file);
      
      const response = await fetch(`/api/athletes/${athleteId}/photo`, {
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
        title: "Photo Uploaded!",
        description: "Athlete photo has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeamId, "athletes"] });
      setPhotoFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AthleteFormData) => {
    if (editingAthlete) {
      updateAthleteMutation.mutate({ id: editingAthlete.id, data });
    } else {
      createAthleteMutation.mutate(data);
    }
  };

  const handleEdit = (athlete: any) => {
    setEditingAthlete(athlete);
    form.reset({
      name: athlete.name,
      grade: athlete.grade,
      weightClass: athlete.weightClass,
      profilePhotoUrl: athlete.profilePhotoUrl || "",
    });
    setShowAddModal(true);
  };

  const handlePhotoUpload = (athleteId: string) => {
    if (photoFile) {
      uploadPhotoMutation.mutate({ athleteId, file: photoFile });
    }
  };

  const filteredAthletes = athletes?.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.weightClass.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
              <h1 className="text-2xl font-semibold text-foreground">Roster Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage your team's athlete roster and profiles
              </p>
            </div>
            <Button 
              onClick={() => {
                setEditingAthlete(null);
                form.reset();
                setShowAddModal(true);
              }}
              data-testid="button-add-athlete"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Athlete
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search athletes by name, grade, or weight class..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-athletes"
                    />
                  </div>
                  <Badge variant="secondary" data-testid="badge-athlete-count">
                    {filteredAthletes.length} athlete{filteredAthletes.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Athletes Grid */}
            {athletesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAthletes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Athletes Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No athletes match your search criteria. Try adjusting your search terms."
                      : "Start building your team roster by adding your first athlete."
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => {
                        setEditingAthlete(null);
                        form.reset();
                        setShowAddModal(true);
                      }}
                      data-testid="button-add-first-athlete"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Your First Athlete
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAthletes.map((athlete) => (
                  <Card key={athlete.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                            {athlete.profilePhotoUrl ? (
                              <img 
                                src={athlete.profilePhotoUrl}
                                alt={`${athlete.name} photo`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-8 w-8 text-secondary-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground" data-testid={`athlete-${athlete.id}-name`}>
                              {athlete.name}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`athlete-${athlete.id}-grade`}>
                              {athlete.grade}
                            </p>
                            <Badge variant="outline" className="mt-1" data-testid={`athlete-${athlete.id}-weight`}>
                              {athlete.weightClass}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(athlete)}
                            data-testid={`button-edit-${athlete.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to remove this athlete from the roster?")) {
                                deleteAthleteMutation.mutate(athlete.id);
                              }
                            }}
                            data-testid={`button-delete-${athlete.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Photo Upload */}
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                          className="text-xs"
                          data-testid={`input-photo-${athlete.id}`}
                        />
                        {photoFile && (
                          <Button
                            size="sm"
                            onClick={() => handlePhotoUpload(athlete.id)}
                            disabled={uploadPhotoMutation.isPending}
                            data-testid={`button-upload-photo-${athlete.id}`}
                          >
                            <Upload className="mr-1 h-3 w-3" />
                            {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Athlete Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAthlete ? "Edit Athlete" : "Add New Athlete"}
            </DialogTitle>
            <DialogDescription>
              {editingAthlete ? "Update athlete information" : "Add a new athlete to your team roster"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Athlete Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Alex Rodriguez"
                data-testid="input-athlete-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Input
                  id="grade"
                  {...form.register("grade")}
                  placeholder="e.g., Junior, 11th"
                  data-testid="input-athlete-grade"
                />
                {form.formState.errors.grade && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.grade.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightClass">Weight Class *</Label>
                <Input
                  id="weightClass"
                  {...form.register("weightClass")}
                  placeholder="e.g., 152 lbs"
                  data-testid="input-athlete-weight"
                />
                {form.formState.errors.weightClass && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.weightClass.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAthlete(null);
                  form.reset();
                }}
                data-testid="button-cancel-athlete"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAthleteMutation.isPending || updateAthleteMutation.isPending}
                data-testid="button-save-athlete"
              >
                {createAthleteMutation.isPending || updateAthleteMutation.isPending
                  ? "Saving..."
                  : editingAthlete
                  ? "Update Athlete"
                  : "Add Athlete"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

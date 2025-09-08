import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import UploadModal from "@/components/upload-modal";
import { useQuery } from "@tanstack/react-query";
import { Upload, FileText, Calendar, Users, Trophy, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CompetitionData() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTeamId, setCurrentTeamId] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);

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

  // Get competitions for current team
  const { data: competitions, isLoading: competitionsLoading } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "competitions"],
    enabled: !!currentTeamId,
  });

  const currentTeam = teams?.find(t => t.id === currentTeamId) || teams?.[0];

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCompetitionStats = (parsedData: any) => {
    if (!parsedData || !parsedData.athletes) return { athleteCount: 0, totalMatches: 0 };
    
    const athletes = parsedData.athletes || [];
    const totalMatches = athletes.reduce((sum: number, athlete: any) => 
      sum + (athlete.wins || 0) + (athlete.losses || 0), 0
    );
    
    return {
      athleteCount: athletes.length,
      totalMatches
    };
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Competition Data</h1>
              <p className="text-sm text-muted-foreground">
                Upload and manage wrestling competition results
              </p>
            </div>
            <Button 
              onClick={() => setShowUploadModal(true)}
              data-testid="button-upload-competition"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Results
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Upload Instructions */}
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Upload Competition Results</h3>
                <p className="text-muted-foreground mb-4">
                  Upload PDF files containing wrestling competition results to automatically extract performance data
                  and generate AI-powered athlete messages for your newsletters.
                </p>
                <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF format only
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    Max 10MB per file
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitions List */}
            {competitionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : competitions && competitions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Recent Competitions</h2>
                  <Badge variant="secondary" data-testid="competition-count">
                    {competitions.length} competition{competitions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {competitions.map((competition) => {
                  const stats = getCompetitionStats(competition.parsedData);
                  
                  return (
                    <Card key={competition.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Trophy className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground" data-testid={`competition-${competition.id}-name`}>
                                {competition.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(competition.date)}
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {stats.athleteCount} athletes
                                </div>
                                <div className="flex items-center">
                                  <Trophy className="h-4 w-4 mr-1" />
                                  {stats.totalMatches} matches
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={stats.athleteCount > 0 ? "default" : "secondary"}
                              data-testid={`competition-${competition.id}-status`}
                            >
                              {stats.athleteCount > 0 ? "Processed" : "Pending"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCompetition(competition)}
                              data-testid={`button-view-${competition.id}`}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View Details
                            </Button>
                            {competition.pdfUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(competition.pdfUrl, '_blank')}
                                data-testid={`button-download-${competition.id}`}
                              >
                                <FileText className="mr-1 h-3 w-3" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Competitions Uploaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by uploading your first competition results to track team performance 
                    and generate personalized athlete messages.
                  </p>
                  <Button 
                    onClick={() => setShowUploadModal(true)}
                    data-testid="button-upload-first"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Your First Competition
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)}
          teamId={currentTeamId}
        />
      )}

      {/* Competition Details Modal */}
      {selectedCompetition && (
        <Dialog open onOpenChange={() => setSelectedCompetition(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCompetition.name}</DialogTitle>
              <DialogDescription>
                Competition details and parsed data
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedCompetition.date)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Athletes Found</Label>
                  <p className="text-sm text-muted-foreground">
                    {getCompetitionStats(selectedCompetition.parsedData).athleteCount}
                  </p>
                </div>
              </div>

              {selectedCompetition.parsedData?.athletes && selectedCompetition.parsedData.athletes.length > 0 ? (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Parsed Athlete Data</Label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedCompetition.parsedData.athletes.map((athlete: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <div>
                            <span className="font-medium">{athlete.name}</span>
                            {athlete.weightClass && (
                              <span className="text-sm text-muted-foreground ml-2">
                                {athlete.weightClass}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {athlete.placement && `#${athlete.placement}`}
                            {athlete.wins !== undefined && ` • ${athlete.wins}W`}
                            {athlete.losses !== undefined && ` • ${athlete.losses}L`}
                            {athlete.pins > 0 && ` • ${athlete.pins} pins`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No athlete data could be extracted from this PDF. The file may need manual review.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

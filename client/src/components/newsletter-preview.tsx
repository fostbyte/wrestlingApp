import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Volleyball, X, Edit, Send, Clock, User } from "lucide-react";

interface NewsletterPreviewProps {
  onClose: () => void;
  team: {
    id: string;
    name: string;
    school: string;
    logoUrl?: string;
    primaryColor?: string;
    teamStoreUrl?: string;
  };
}

export default function NewsletterPreview({ onClose, team }: NewsletterPreviewProps) {
  const [subject, setSubject] = useState(`${team.name} Weekly Update - ${new Date().toLocaleDateString()}`);
  const [teamMessage, setTeamMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Get team athletes for newsletter
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/teams", team.id, "athletes"],
    enabled: !!team.id,
  });

  // Get recent competitions for context
  const { data: competitions } = useQuery({
    queryKey: ["/api/teams", team.id, "competitions"],
    enabled: !!team.id,
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: async (data: { subject: string; teamMessage: string; athleteMessages: any[] }) => {
      // First create the newsletter
      const newsletter = await apiRequest("POST", `/api/teams/${team.id}/newsletters`, data);
      
      // Then send it
      await apiRequest("POST", `/api/newsletters/${newsletter.id}/send`, {});
      
      return newsletter;
    },
    onSuccess: () => {
      toast({
        title: "Newsletter Sent!",
        description: "Your newsletter has been sent to all team subscribers.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send newsletter",
        variant: "destructive",
      });
    },
  });

  const generateTeamMessageMutation = useMutation({
    mutationFn: async () => {
      const recentCompetition = competitions?.[0];
      const teamPerformance = {
        competitionName: recentCompetition?.name || "Recent Competition",
        athleteCount: athletes?.length || 0,
      };
      
      const response = await apiRequest("POST", `/api/teams/${team.id}/generate-team-message`, {
        competitionName: recentCompetition?.name || "Recent Competition",
        teamPerformance,
      });
      
      return response.message;
    },
    onSuccess: (message) => {
      setTeamMessage(message);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate team message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a newsletter subject",
        variant: "destructive",
      });
      return;
    }

    const athleteMessages = athletes?.map(athlete => ({
      athleteId: athlete.id,
      athleteName: athlete.name,
      grade: athlete.grade,
      weightClass: athlete.weightClass,
      message: `Great work this season, ${athlete.name}! Keep up the excellent effort in the ${athlete.weightClass} weight class.`,
    })) || [];

    sendNewsletterMutation.mutate({
      subject,
      teamMessage,
      athleteMessages,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Newsletter Preview</DialogTitle>
              <DialogDescription>
                Review and customize your newsletter before sending
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              data-testid="button-close-preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Newsletter Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Newsletter subject"
                data-testid="input-subject"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="team-message">Team Message</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTeamMessageMutation.mutate()}
                  disabled={generateTeamMessageMutation.isPending}
                  data-testid="button-generate-message"
                >
                  {generateTeamMessageMutation.isPending ? "Generating..." : "Generate AI Message"}
                </Button>
              </div>
              <Textarea
                id="team-message"
                value={teamMessage}
                onChange={(e) => setTeamMessage(e.target.value)}
                placeholder="Enter your team message or generate one with AI..."
                className="min-h-[100px]"
                data-testid="textarea-team-message"
              />
            </div>
          </div>

          {/* Newsletter Preview */}
          <Card className="p-0 overflow-hidden">
            <div className="bg-white border border-border max-w-2xl mx-auto">
              {/* Team Header */}
              <div 
                className="text-center border-b border-border p-6"
                style={{ backgroundColor: `${team.primaryColor}10` }}
              >
                <div 
                  className="w-16 h-16 rounded-lg mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
                >
                  {team.logoUrl ? (
                    <img 
                      src={team.logoUrl} 
                      alt={`${team.name} logo`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Volleyball className="h-8 w-8 text-white" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="preview-team-name">
                  {team.name}
                </h1>
                <p className="text-muted-foreground" data-testid="preview-school-name">
                  {team.school}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </p>
              </div>

              {/* Team Message */}
              {teamMessage && (
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Coach's Message</h2>
                  <p className="text-muted-foreground leading-relaxed" data-testid="preview-team-message">
                    {teamMessage}
                  </p>
                </div>
              )}

              {/* Athlete Highlights */}
              {athletes && athletes.length > 0 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Athlete Highlights</h2>
                  <div className="space-y-4">
                    {athletes.slice(0, 3).map((athlete) => (
                      <div key={athlete.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start space-x-4">
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
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground" data-testid={`preview-athlete-${athlete.id}-name`}>
                              {athlete.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {athlete.grade} • {athlete.weightClass}
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">
                              Great work this season, {athlete.name}! Keep up the excellent effort 
                              in the {athlete.weightClass} weight class.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div className="p-6 bg-muted/30 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-4">Support our team's success!</p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
                    className="text-white"
                    data-testid="preview-support-button"
                  >
                    Support Our Team
                  </Button>
                  {team.teamStoreUrl && (
                    <Button variant="outline" data-testid="preview-store-button">
                      Team Store
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              data-testid="button-edit"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Content
            </Button>
            <Button
              variant="outline"
              disabled
              data-testid="button-schedule"
            >
              <Clock className="mr-2 h-4 w-4" />
              Schedule for Later
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendNewsletterMutation.isPending || !subject.trim()}
              data-testid="button-send-now"
            >
              <Send className="mr-2 h-4 w-4" />
              {sendNewsletterMutation.isPending 
                ? "Sending..." 
                : `Send Now${athletesLoading ? "" : ` (${athletes?.length || 0} athletes)`}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

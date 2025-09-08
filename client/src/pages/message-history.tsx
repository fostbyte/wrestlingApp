import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  History, 
  Mail, 
  Calendar, 
  Users, 
  Search, 
  Eye,
  Newspaper,
  MessageSquare,
  Filter,
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MessageHistory() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTeamId, setCurrentTeamId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [filterType, setFilterType] = useState<"all" | "newsletter" | "custom">("all");

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

  // Get message history for current team
  const { data: messageHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "message-history"],
    enabled: !!currentTeamId,
  });

  // Get newsletters for current team
  const { data: newsletters } = useQuery({
    queryKey: ["/api/teams", currentTeamId, "newsletters"],
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

  // Combine and sort all messages
  const allMessages = [
    ...(messageHistory || []).map(msg => ({
      ...msg,
      type: msg.type as "newsletter" | "custom",
      date: msg.sentAt,
    })),
    ...(newsletters || [])
      .filter(newsletter => newsletter.sentAt)
      .map(newsletter => ({
        id: newsletter.id,
        type: "newsletter" as const,
        subject: newsletter.subject,
        content: newsletter.teamMessage,
        recipientCount: newsletter.recipientCount,
        date: newsletter.sentAt,
        athleteMessages: newsletter.athleteMessages,
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter messages
  const filteredMessages = allMessages.filter(msg => {
    const matchesSearch = msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || msg.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessagePreview = (content: string) => {
    if (!content) return "No content preview available";
    return content.length > 100 ? content.substring(0, 100) + "..." : content;
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
              <h1 className="text-2xl font-semibold text-foreground">Message History</h1>
              <p className="text-sm text-muted-foreground">
                View and manage your team's sent communications
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/newsletters'}
              data-testid="button-create-new"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Create New Message
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                      <p className="text-2xl font-semibold text-foreground" data-testid="stat-total-messages">
                        {allMessages.length}
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
                      <p className="text-sm font-medium text-muted-foreground">Newsletters</p>
                      <p className="text-2xl font-semibold text-foreground" data-testid="stat-newsletters">
                        {allMessages.filter(msg => msg.type === 'newsletter').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                      <p className="text-2xl font-semibold text-foreground" data-testid="stat-recipients">
                        {allMessages.reduce((sum, msg) => sum + (msg.recipientCount || 0), 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages by subject or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-messages"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as "all" | "newsletter" | "custom")}
                      data-testid="select-filter-type"
                    >
                      <option value="all">All Messages</option>
                      <option value="newsletter">Newsletters Only</option>
                      <option value="custom">Custom Messages Only</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message List */}
            {historyLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchTerm || filterType !== "all" ? "No Messages Found" : "No Message History"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterType !== "all" 
                      ? "No messages match your search criteria. Try adjusting your search or filter."
                      : "You haven't sent any newsletters or messages yet. Start creating your first communication!"
                    }
                  </p>
                  {!searchTerm && filterType === "all" && (
                    <Button 
                      onClick={() => window.location.href = '/newsletters'}
                      data-testid="button-create-first-message"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Create Your First Message
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <Card key={`${message.type}-${message.id}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            {message.type === 'newsletter' ? (
                              <Newspaper className="h-6 w-6 text-primary" />
                            ) : (
                              <MessageSquare className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate" data-testid={`message-${message.id}-subject`}>
                                {message.subject || "Untitled Message"}
                              </h3>
                              <Badge 
                                variant={message.type === 'newsletter' ? 'default' : 'secondary'}
                                data-testid={`message-${message.id}-type`}
                              >
                                {message.type === 'newsletter' ? 'Newsletter' : 'Custom'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2" data-testid={`message-${message.id}-preview`}>
                              {getMessagePreview(message.content || "")}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(message.date)}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {message.recipientCount || 0} recipient{(message.recipientCount || 0) !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMessage(message)}
                            data-testid={`button-view-${message.id}`}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Message Details Modal */}
      {selectedMessage && (
        <Dialog open onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {selectedMessage.type === 'newsletter' ? (
                  <Newspaper className="h-5 w-5" />
                ) : (
                  <MessageSquare className="h-5 w-5" />
                )}
                <span>{selectedMessage.subject || "Untitled Message"}</span>
              </DialogTitle>
              <DialogDescription>
                Sent on {formatDate(selectedMessage.date)} to {selectedMessage.recipientCount || 0} recipient{(selectedMessage.recipientCount || 0) !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Message Content</h4>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedMessage.content || "No content available"}
                  </p>
                </div>
              </div>

              {selectedMessage.type === 'newsletter' && selectedMessage.athleteMessages && (
                <div>
                  <h4 className="font-medium mb-2">Athlete Messages</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedMessage.athleteMessages.map((athleteMsg: any, index: number) => (
                      <div key={index} className="p-3 bg-muted/30 rounded border">
                        <div className="font-medium text-sm mb-1">
                          {athleteMsg.athleteName} ({athleteMsg.grade}, {athleteMsg.weightClass})
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {athleteMsg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

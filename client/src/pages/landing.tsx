import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volleyball, Users, Mail, Trophy, Zap, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-primary rounded-2xl">
                  <Volleyball className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Volleyball Team Newsletter Platform
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Streamline team communication with AI-powered newsletters, roster management, 
                and fundraising tools designed specifically for wrestling coaches.
              </p>
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="px-8 py-3 text-lg"
                data-testid="button-login"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Save time, increase engagement, and strengthen your team community 
              with our comprehensive communication platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>AI-Powered Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Generate personalized athlete messages and team updates automatically 
                  based on competition results and performance data.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>Roster Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Organize athlete profiles, track performance statistics, 
                  and manage contact information all in one place.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>Email Newsletters</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Send professional newsletters to parents and supporters with 
                  team branding and personalized athlete highlights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>Competition Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Upload competition PDFs and automatically extract performance 
                  data to generate meaningful updates for your community.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>Team Branding</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Customize newsletters with your team colors, logo, and brand voice 
                  to create consistent, professional communications.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>Fundraising Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Include donation links and team store promotions in every 
                  newsletter to support your team's fundraising efforts.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Team Communication?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join wrestling coaches who are saving time and increasing engagement 
            with AI-powered team newsletters.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="px-8 py-3 text-lg"
            data-testid="button-get-started"
          >
            Get Started Today
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Volleyball className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground">WrestleComm</span>
            </div>
            <p className="text-muted-foreground">
              Empowering wrestling coaches with better communication tools
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

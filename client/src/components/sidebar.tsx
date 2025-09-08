import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChartLine, 
  Settings, 
  Users, 
  Mail, 
  Upload, 
  Newspaper, 
  History,
  Volleyball,
  User,
  MoreVertical
} from "lucide-react";

interface SidebarProps {
  currentTeam?: {
    id: string;
    name: string;
    school: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

export default function Sidebar({ currentTeam }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: ChartLine,
      current: location === "/"
    },
    { 
      name: "Team Setup", 
      href: "/team-setup", 
      icon: Settings,
      current: location === "/team-setup"
    },
    { 
      name: "Roster Management", 
      href: "/roster", 
      icon: Users,
      current: location === "/roster"
    },
    { 
      name: "Email Management", 
      href: "/emails", 
      icon: Mail,
      current: location === "/emails"
    },
    { 
      name: "Competition Data", 
      href: "/competitions", 
      icon: Upload,
      current: location === "/competitions"
    },
    { 
      name: "Create Newsletter", 
      href: "/newsletters", 
      icon: Newspaper,
      current: location === "/newsletters"
    },
    { 
      name: "Message History", 
      href: "/history", 
      icon: History,
      current: location === "/history"
    },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-card border-r border-border overflow-y-auto">
        {/* Team Branding Header */}
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            {currentTeam?.logoUrl ? (
              <img 
                src={currentTeam.logoUrl} 
                alt={`${currentTeam.name} logo`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Volleyball className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground" data-testid="text-team-name">
              {currentTeam?.name || "Volleyball Team"}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-school-name">
              {currentTeam?.school || "High School"}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.current ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    item.current 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="flex-shrink-0 p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-foreground" data-testid="text-coach-name">
                Coach
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-coach-role">
                Primary Coach
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

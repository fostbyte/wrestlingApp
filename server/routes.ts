import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTeamSchema, insertAthleteSchema, insertAthleteEmailSchema, insertCompetitionSchema } from "@shared/schema";
import { generateAthleteMessage, generateTeamMessage } from "./services/openai";
import { sendNewsletter } from "./services/emailService";
import { parsePDF } from "./services/pdfParser";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

const uploadImage = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Team routes
  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTeamSchema.parse({ 
        ...req.body, 
        primaryCoachId: userId 
      });
      
      const team = await storage.createTeam(validatedData);
      res.json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: "Failed to create team", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teams = await storage.getTeamsByCoach(userId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.put('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(req.params.id, validatedData);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(400).json({ message: "Failed to update team", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/teams/:id/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getTeamStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      res.status(500).json({ message: "Failed to fetch team stats" });
    }
  });

  // Upload team logo
  app.post('/api/teams/:id/logo', isAuthenticated, uploadImage.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // In a real app, you'd upload to cloud storage and get the URL
      const logoUrl = `/uploads/${req.file.filename}`;
      const team = await storage.updateTeam(req.params.id, { logoUrl });
      
      res.json({ logoUrl: team.logoUrl });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Athlete routes
  app.post('/api/teams/:teamId/athletes', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAthleteSchema.parse({
        ...req.body,
        teamId: req.params.teamId
      });
      
      const athlete = await storage.createAthlete(validatedData);
      res.json(athlete);
    } catch (error) {
      console.error("Error creating athlete:", error);
      res.status(400).json({ message: "Failed to create athlete", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/teams/:teamId/athletes', isAuthenticated, async (req, res) => {
    try {
      const athletes = await storage.getAthletesByTeam(req.params.teamId);
      res.json(athletes);
    } catch (error) {
      console.error("Error fetching athletes:", error);
      res.status(500).json({ message: "Failed to fetch athletes" });
    }
  });

  app.put('/api/athletes/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAthleteSchema.partial().parse(req.body);
      const athlete = await storage.updateAthlete(req.params.id, validatedData);
      res.json(athlete);
    } catch (error) {
      console.error("Error updating athlete:", error);
      res.status(400).json({ message: "Failed to update athlete", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete('/api/athletes/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAthlete(req.params.id);
      res.json({ message: "Athlete deleted successfully" });
    } catch (error) {
      console.error("Error deleting athlete:", error);
      res.status(500).json({ message: "Failed to delete athlete" });
    }
  });

  // Upload athlete photo
  app.post('/api/athletes/:id/photo', isAuthenticated, uploadImage.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const profilePhotoUrl = `/uploads/${req.file.filename}`;
      const athlete = await storage.updateAthlete(req.params.id, { profilePhotoUrl });
      
      res.json({ profilePhotoUrl: athlete.profilePhotoUrl });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Email routes
  app.post('/api/athletes/:athleteId/emails', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAthleteEmailSchema.parse({
        ...req.body,
        athleteId: req.params.athleteId
      });
      
      const email = await storage.addAthleteEmail(validatedData);
      res.json(email);
    } catch (error) {
      console.error("Error adding email:", error);
      res.status(400).json({ message: "Failed to add email", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/athletes/:athleteId/emails', isAuthenticated, async (req, res) => {
    try {
      const emails = await storage.getAthleteEmails(req.params.athleteId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.delete('/api/emails/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAthleteEmail(req.params.id);
      res.json({ message: "Email deleted successfully" });
    } catch (error) {
      console.error("Error deleting email:", error);
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  app.get('/api/teams/:teamId/email-count', isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getTeamEmailCount(req.params.teamId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching email count:", error);
      res.status(500).json({ message: "Failed to fetch email count" });
    }
  });

  // Competition routes
  app.post('/api/teams/:teamId/competitions', isAuthenticated, upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }
      
      // Parse PDF
      const parsedData = await parsePDF(req.file.path);
      
      const validatedData = insertCompetitionSchema.parse({
        ...req.body,
        teamId: req.params.teamId,
        pdfUrl: `/uploads/${req.file.filename}`,
        parsedData
      });
      
      const competition = await storage.createCompetition(validatedData);
      res.json(competition);
    } catch (error) {
      console.error("Error creating competition:", error);
      res.status(400).json({ message: "Failed to create competition", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/teams/:teamId/competitions', isAuthenticated, async (req, res) => {
    try {
      const competitions = await storage.getCompetitionsByTeam(req.params.teamId);
      res.json(competitions);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Failed to fetch competitions" });
    }
  });

  // AI content generation routes
  app.post('/api/athletes/:athleteId/generate-message', isAuthenticated, async (req, res) => {
    try {
      const { teamBrandVoice, recentPerformance } = req.body;
      const athlete = await storage.getAthlete(req.params.athleteId);
      
      if (!athlete) {
        return res.status(404).json({ message: "Athlete not found" });
      }
      
      const seasonStats = await storage.getAthleteSeasonStats(req.params.athleteId);
      const message = await generateAthleteMessage(athlete, recentPerformance, seasonStats, teamBrandVoice);
      
      res.json({ message });
    } catch (error) {
      console.error("Error generating athlete message:", error);
      res.status(500).json({ message: "Failed to generate message", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post('/api/teams/:teamId/generate-team-message', isAuthenticated, async (req, res) => {
    try {
      const { competitionName, teamPerformance } = req.body;
      const team = await storage.getTeam(req.params.teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const message = await generateTeamMessage(team, competitionName, teamPerformance);
      res.json({ message });
    } catch (error) {
      console.error("Error generating team message:", error);
      res.status(500).json({ message: "Failed to generate message", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Newsletter routes
  app.post('/api/teams/:teamId/newsletters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = {
        ...req.body,
        teamId: req.params.teamId,
        createdBy: userId
      };
      
      const newsletter = await storage.createNewsletter(validatedData);
      res.json(newsletter);
    } catch (error) {
      console.error("Error creating newsletter:", error);
      res.status(400).json({ message: "Failed to create newsletter", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/teams/:teamId/newsletters', isAuthenticated, async (req, res) => {
    try {
      const newsletters = await storage.getNewslettersByTeam(req.params.teamId);
      res.json(newsletters);
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      res.status(500).json({ message: "Failed to fetch newsletters" });
    }
  });

  app.post('/api/newsletters/:id/send', isAuthenticated, async (req, res) => {
    try {
      const newsletter = await storage.updateNewsletter(req.params.id, {
        sentAt: new Date(),
      });
      
      // Send email newsletter
      await sendNewsletter(newsletter);
      
      res.json({ message: "Newsletter sent successfully" });
    } catch (error) {
      console.error("Error sending newsletter:", error);
      res.status(500).json({ message: "Failed to send newsletter", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Message history routes
  app.get('/api/teams/:teamId/message-history', isAuthenticated, async (req, res) => {
    try {
      const history = await storage.getMessageHistory(req.params.teamId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching message history:", error);
      res.status(500).json({ message: "Failed to fetch message history" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}

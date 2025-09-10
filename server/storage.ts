import {
  users,
  teams,
  teamCoaches,
  athletes,
  athleteEmails,
  competitions,
  athletePerformances,
  newsletters,
  messageHistory,
  type User,
  type UpsertUser,
  type Team,
  type InsertTeam,
  type Athlete,
  type InsertAthlete,
  type AthleteEmail,
  type InsertAthleteEmail,
  type Competition,
  type InsertCompetition,
  type AthletePerformance,
  type InsertAthletePerformance,
  type Newsletter,
  type InsertNewsletter,
  type MessageHistory,
  insertUserSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: z.infer<typeof insertUserSchema>): Promise<User>;
  getUserByEmail(email: string): Promise<typeof users.$inferSelect | undefined>;

  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  getTeamsByCoach(coachId: string): Promise<Team[]>;
  updateTeam(id: string, updates: Partial<InsertTeam>): Promise<Team>;

  // Athlete operations
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthletesByTeam(teamId: string): Promise<Athlete[]>;
  updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete>;
  deleteAthlete(id: string): Promise<void>;

  // Email operations
  addAthleteEmail(email: InsertAthleteEmail): Promise<AthleteEmail>;
  getAthleteEmails(athleteId: string): Promise<AthleteEmail[]>;
  getTeamEmailCount(teamId: string): Promise<number>;
  deleteAthleteEmail(id: string): Promise<void>;

  // Competition operations
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  getCompetitionsByTeam(teamId: string): Promise<Competition[]>;

  // Performance operations
  createPerformance(performance: InsertAthletePerformance): Promise<AthletePerformance>;
  getPerformancesByCompetition(competitionId: string): Promise<AthletePerformance[]>;
  getAthleteSeasonStats(athleteId: string): Promise<{ wins: number; losses: number; pins: number }>;

  // Newsletter operations
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  getNewslettersByTeam(teamId: string): Promise<Newsletter[]>;
  updateNewsletter(id: string, updates: Partial<InsertNewsletter>): Promise<Newsletter>;

  // Message history operations
  getMessageHistory(teamId: string): Promise<MessageHistory[]>;

  // Stats operations
  getTeamStats(teamId: string): Promise<{
    totalAthletes: number;
    emailSubscribers: number;
    newslettersSent: number;
    seasonRecord: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: z.infer<typeof insertUserSchema>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...userData, password: hashedPassword })
      .returning();
    const { password, ...rest } = user;
    return rest;
  }

  async getUserByEmail(email: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Team operations
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamsByCoach(coachId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.primaryCoachId, coachId));
  }

  async updateTeam(id: string, updates: Partial<InsertTeam>): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  // Athlete operations
  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const [newAthlete] = await db.insert(athletes).values(athlete).returning();
    return newAthlete;
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    const [athlete] = await db.select().from(athletes).where(eq(athletes.id, id));
    return athlete;
  }

  async getAthletesByTeam(teamId: string): Promise<Athlete[]> {
    return await db.select().from(athletes).where(eq(athletes.teamId, teamId));
  }

  async updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete> {
    const [athlete] = await db
      .update(athletes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(athletes.id, id))
      .returning();
    return athlete;
  }

  async deleteAthlete(id: string): Promise<void> {
    await db.delete(athletes).where(eq(athletes.id, id));
  }

  // Email operations
  async addAthleteEmail(email: InsertAthleteEmail): Promise<AthleteEmail> {
    const [newEmail] = await db.insert(athleteEmails).values(email).returning();
    return newEmail;
  }

  async getAthleteEmails(athleteId: string): Promise<AthleteEmail[]> {
    return await db.select().from(athleteEmails).where(eq(athleteEmails.athleteId, athleteId));
  }

  async getTeamEmailCount(teamId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(athleteEmails)
      .innerJoin(athletes, eq(athleteEmails.athleteId, athletes.id))
      .where(eq(athletes.teamId, teamId));
    return result[0]?.count || 0;
  }

  async deleteAthleteEmail(id: string): Promise<void> {
    await db.delete(athleteEmails).where(eq(athleteEmails.id, id));
  }

  // Competition operations
  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const [newCompetition] = await db.insert(competitions).values(competition).returning();
    return newCompetition;
  }

  async getCompetitionsByTeam(teamId: string): Promise<Competition[]> {
    return await db
      .select()
      .from(competitions)
      .where(eq(competitions.teamId, teamId))
      .orderBy(desc(competitions.date));
  }

  // Performance operations
  async createPerformance(performance: InsertAthletePerformance): Promise<AthletePerformance> {
    const [newPerformance] = await db.insert(athletePerformances).values(performance).returning();
    return newPerformance;
  }

  async getPerformancesByCompetition(competitionId: string): Promise<AthletePerformance[]> {
    return await db.select().from(athletePerformances).where(eq(athletePerformances.competitionId, competitionId));
  }

  async getAthleteSeasonStats(athleteId: string): Promise<{ wins: number; losses: number; pins: number }> {
    const performances = await db.select().from(athletePerformances).where(eq(athletePerformances.athleteId, athleteId));

    const stats = performances.reduce(
      (acc, perf) => ({
        wins: acc.wins + (perf.wins || 0),
        losses: acc.losses + (perf.losses || 0),
        pins: acc.pins + (perf.pins || 0),
      }),
      { wins: 0, losses: 0, pins: 0 }
    );

    return stats;
  }

  // Newsletter operations
  async createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const [newNewsletter] = await db.insert(newsletters).values(newsletter).returning();
    return newNewsletter;
  }

  async getNewslettersByTeam(teamId: string): Promise<Newsletter[]> {
    return await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.teamId, teamId))
      .orderBy(desc(newsletters.createdAt));
  }

  async updateNewsletter(id: string, updates: Partial<InsertNewsletter>): Promise<Newsletter> {
    const [newsletter] = await db
      .update(newsletters)
      .set(updates)
      .where(eq(newsletters.id, id))
      .returning();
    return newsletter;
  }

  // Message history operations
  async getMessageHistory(teamId: string): Promise<MessageHistory[]> {
    return await db
      .select()
      .from(messageHistory)
      .where(eq(messageHistory.teamId, teamId))
      .orderBy(desc(messageHistory.sentAt))
      .limit(50);
  }

  // Stats operations
  async getTeamStats(teamId: string): Promise<{
    totalAthletes: number;
    emailSubscribers: number;
    newslettersSent: number;
    seasonRecord: string;
  }> {
    const athleteCountResult = await db
      .select({ count: count() })
      .from(athletes)
      .where(eq(athletes.teamId, teamId));

    const emailCountResult = await db
      .select({ count: count() })
      .from(athleteEmails)
      .innerJoin(athletes, eq(athleteEmails.athleteId, athletes.id))
      .where(eq(athletes.teamId, teamId));

    const newsletterCountResult = await db
      .select({ count: count() })
      .from(newsletters)
      .where(and(eq(newsletters.teamId, teamId), isNotNull(newsletters.sentAt)));

    // Calculate season record
    const performances = await db
      .select()
      .from(athletePerformances)
      .innerJoin(competitions, eq(athletePerformances.competitionId, competitions.id))
      .where(eq(competitions.teamId, teamId));

    const totalStats = performances.reduce(
      (acc, perf) => ({
        wins: acc.wins + (perf.athlete_performances.wins || 0),
        losses: acc.losses + (perf.athlete_performances.losses || 0),
      }),
      { wins: 0, losses: 0 }
    );

    return {
      totalAthletes: athleteCountResult[0]?.count || 0,
      emailSubscribers: emailCountResult[0]?.count || 0,
      newslettersSent: newsletterCountResult[0]?.count || 0,
      seasonRecord: `${totalStats.wins}-${totalStats.losses}`,
    };
  }
}

export const storage = new DatabaseStorage();
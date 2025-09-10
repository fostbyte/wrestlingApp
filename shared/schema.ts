import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["system_admin", "primary_coach", "super_user_coach"] }).default("primary_coach"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  school: varchar("school").notNull(),
  logoUrl: varchar("logo_url"),
  primaryColor: varchar("primary_color").default("#3B82F6"),
  secondaryColor: varchar("secondary_color").default("#1E40AF"),
  brandVoice: text("brand_voice"),
  teamStoreUrl: varchar("team_store_url"),
  primaryCoachId: varchar("primary_coach_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamCoaches = pgTable("team_coaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  coachId: varchar("coach_id").references(() => users.id).notNull(),
  role: varchar("role", { enum: ["primary_coach", "super_user_coach"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const athletes = pgTable("athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  name: varchar("name").notNull(),
  grade: varchar("grade").notNull(),
  weightClass: varchar("weight_class").notNull(),
  profilePhotoUrl: varchar("profile_photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const athleteEmails = pgTable("athlete_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").references(() => athletes.id).notNull(),
  email: varchar("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  name: varchar("name").notNull(),
  date: timestamp("date").notNull(),
  pdfUrl: varchar("pdf_url"),
  parsedData: jsonb("parsed_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const athletePerformances = pgTable("athlete_performances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").references(() => competitions.id).notNull(),
  athleteId: varchar("athlete_id").references(() => athletes.id).notNull(),
  placement: integer("placement"),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  pins: integer("pins").default(0),
  takedowns: integer("takedowns").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsletters = pgTable("newsletters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  subject: varchar("subject").notNull(),
  teamMessage: text("team_message"),
  athleteMessages: jsonb("athlete_messages"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageHistory = pgTable("message_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  type: varchar("type", { enum: ["newsletter", "custom"] }).notNull(),
  subject: varchar("subject"),
  content: text("content"),
  recipientCount: integer("recipient_count").default(0),
  sentAt: timestamp("sent_at").notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const teamsRelations = relations(teams, ({ one, many }) => ({
  primaryCoach: one(users, {
    fields: [teams.primaryCoachId],
    references: [users.id],
  }),
  coaches: many(teamCoaches),
  athletes: many(athletes),
  competitions: many(competitions),
  newsletters: many(newsletters),
  messageHistory: many(messageHistory),
}));

export const usersRelations = relations(users, ({ many }) => ({
  primaryTeams: many(teams),
  teamCoaches: many(teamCoaches),
  newsletters: many(newsletters),
  messageHistory: many(messageHistory),
}));

export const teamCoachesRelations = relations(teamCoaches, ({ one }) => ({
  team: one(teams, {
    fields: [teamCoaches.teamId],
    references: [teams.id],
  }),
  coach: one(users, {
    fields: [teamCoaches.coachId],
    references: [users.id],
  }),
}));

export const athletesRelations = relations(athletes, ({ one, many }) => ({
  team: one(teams, {
    fields: [athletes.teamId],
    references: [teams.id],
  }),
  emails: many(athleteEmails),
  performances: many(athletePerformances),
}));

export const athleteEmailsRelations = relations(athleteEmails, ({ one }) => ({
  athlete: one(athletes, {
    fields: [athleteEmails.athleteId],
    references: [athletes.id],
  }),
}));

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  team: one(teams, {
    fields: [competitions.teamId],
    references: [teams.id],
  }),
  performances: many(athletePerformances),
}));

export const athletePerformancesRelations = relations(athletePerformances, ({ one }) => ({
  competition: one(competitions, {
    fields: [athletePerformances.competitionId],
    references: [competitions.id],
  }),
  athlete: one(athletes, {
    fields: [athletePerformances.athleteId],
    references: [athletes.id],
  }),
}));

export const newslettersRelations = relations(newsletters, ({ one }) => ({
  team: one(teams, {
    fields: [newsletters.teamId],
    references: [teams.id],
  }),
  createdBy: one(users, {
    fields: [newsletters.createdBy],
    references: [users.id],
  }),
}));

export const messageHistoryRelations = relations(messageHistory, ({ one }) => ({
  team: one(teams, {
    fields: [messageHistory.teamId],
    references: [teams.id],
  }),
  createdBy: one(users, {
    fields: [messageHistory.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAthleteEmailSchema = createInsertSchema(athleteEmails).omit({
  id: true,
  createdAt: true,
});

export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
});

export const insertAthletePerformanceSchema = createInsertSchema(athletePerformances).omit({
  id: true,
  createdAt: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  createdAt: true,
});

// Types
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type UpsertUser = typeof users.$inferInsert;
export type User = Omit<typeof users.$inferSelect, "password">;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Athlete = typeof athletes.$inferSelect;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type AthleteEmail = typeof athleteEmails.$inferSelect;
export type InsertAthleteEmail = z.infer<typeof insertAthleteEmailSchema>;
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type AthletePerformance = typeof athletePerformances.$inferSelect;
export type InsertAthletePerformance = z.infer<typeof insertAthletePerformanceSchema>;
export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type MessageHistory = typeof messageHistory.$inferSelect;

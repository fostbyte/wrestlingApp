# Wrestling Team Newsletter & Fundraising Platform

## Overview

This is a web application designed for wrestling coaches to create personalized newsletters and manage fundraising communications using AI-generated content based on competition results. The platform provides tools for team management, roster tracking, email communications, and automated newsletter creation. It specifically targets high school and middle school wrestling coaches who need to streamline their communication with parents and supporters while maintaining professional team branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with React 18 and TypeScript, using Vite as the build tool
- **Component Library**: Shadcn/ui components built on Radix UI primitives for consistent design
- **Styling**: TailwindCSS with CSS variables for theming and custom color schemes
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Express.js Server**: Node.js/Express backend with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect for user authentication
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **File Handling**: Multer for PDF uploads and image processing
- **API Design**: RESTful API with standardized error handling and request logging

### Database Schema
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Core Entities**: Users, Teams, Athletes, Competitions, Newsletters, Message History
- **Relationships**: Teams have coaches and athletes, athletes have performance records and email contacts
- **Session Storage**: Dedicated sessions table for authentication state

### Authentication & Authorization
- **Replit Auth Integration**: OpenID Connect flow for user authentication
- **Role-Based Access**: System admin, primary coach, and super user coach roles
- **Session Security**: HTTP-only cookies with secure flags and session expiration

### Data Processing Pipeline
- **PDF Parser**: Custom service to extract competition results from uploaded PDFs
- **AI Content Generation**: OpenAI GPT-5 integration for personalized athlete messages and team newsletters
- **Email Service**: Nodemailer integration for newsletter distribution with SMTP configuration

### File Management
- **Upload Handling**: Separate endpoints for PDF competition data and image uploads
- **File Validation**: MIME type checking and size limits for security
- **Storage Strategy**: Local file storage with configurable upload directories

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Replit Authentication**: OAuth provider for user management and session handling
- **OpenAI API**: GPT-5 model for AI-powered content generation and personalized messaging

### Email Infrastructure
- **SMTP Service**: Configurable email service (default Gmail) for newsletter delivery
- **Nodemailer**: Email sending library with template support and attachment handling

### Development Tools
- **Vite**: Frontend build tool with HMR and TypeScript support
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Backend bundling for production deployment

### UI/UX Libraries
- **Radix UI**: Headless component primitives for accessibility and functionality
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework with custom design tokens

### Validation & Type Safety
- **Zod**: Runtime type validation for API requests and form data
- **TypeScript**: Static type checking across frontend and backend
- **Drizzle Zod**: Integration between database schema and validation
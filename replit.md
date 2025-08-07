# Overview

This project is a baby name selection app called "BabySwipe" that allows couples to collaboratively choose baby names through a Tinder-like swiping interface. Partners can swipe on baby names (like/dislike) and see their matches in real-time. The application features a React frontend with Express backend, real-time WebSocket communication, and PostgreSQL database integration using Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React app using TypeScript for type safety
- **Vite**: Fast build tool and development server for optimal development experience
- **Routing**: Uses wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Real-time Communication**: WebSocket integration for live partner connections and match notifications

## Backend Architecture
- **Express.js**: Node.js web framework handling API routes and WebSocket connections
- **TypeScript**: Full-stack TypeScript implementation for consistency
- **Session Management**: UUID-based sessions with expiration handling
- **WebSocket Server**: Real-time bidirectional communication for partner connectivity and match notifications
- **Storage Layer**: Abstracted storage interface with in-memory implementation, designed for easy database integration

## Data Layer
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Sessions table for managing collaborative sessions
  - SwipeActions table for tracking user preferences
  - BabyNames table with comprehensive name data (origin, meaning, gender, ranking)
- **Migration System**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL integration

## Authentication & Session Management
- **Sessionless Design**: Uses UUID-based user identification without traditional authentication
- **Temporary Sessions**: Sessions expire automatically to manage data lifecycle
- **Partner Coordination**: WebSocket-based real-time partner connection tracking

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **Replit Integration**: Development environment optimizations with Replit-specific plugins

## Frontend Libraries
- **UI Components**: Comprehensive Radix UI component library for accessible primitives
- **Styling**: Tailwind CSS with custom design system variables
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Zod validation using @hookform/resolvers
- **Animations**: Class Variance Authority for component variant management

## Backend Libraries
- **Database**: Drizzle ORM with Zod schema validation
- **WebSockets**: ws library for real-time communication
- **Development**: tsx for TypeScript execution and hot reloading
- **Build System**: esbuild for production bundling

## Development Tools
- **Build Pipeline**: Vite for frontend, esbuild for backend
- **Type Checking**: TypeScript with strict configuration
- **Database Tools**: Drizzle Kit for migrations and schema management
- **CSS Processing**: PostCSS with Tailwind CSS and Autoprefixer
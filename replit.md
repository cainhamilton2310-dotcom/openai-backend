# AI Dungeon Master - D&D Game Assistant

## Overview

This is a full-stack web application that serves as an AI-powered Dungeon Master for Dungeons & Dragons games. The application allows players to create characters, engage in interactive storytelling, roll dice, manage inventory, and have conversations with an AI DM that responds dynamically to player actions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom fantasy-themed color palette
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Development**: Hot module replacement via Vite middleware in development
- **Session Management**: In-memory storage (development) with plans for PostgreSQL

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with Zod schema validation
- **Current State**: In-memory storage implementation for development
- **Migration Strategy**: Drizzle Kit for database migrations

## Key Components

### 1. Character Management System
- Character creation with customizable stats (strength, dexterity, constitution, intelligence, wisdom, charisma)
- Support for different D&D classes (Fighter, Wizard, Rogue, etc.)
- Health and experience tracking
- Character persistence across game sessions

### 2. Game Session Management
- Session-based gameplay with persistent state
- Scene tracking and narrative progression
- Active session management per character
- Message history storage

### 3. AI Dungeon Master
- **Integration**: OpenAI GPT-4o for dynamic story generation
- **Context Awareness**: Maintains character stats, current scene, and message history
- **Response Types**: Narrative responses, skill checks, combat actions
- **Dice Integration**: Automatic dice roll interpretation and story adaptation

### 4. Dice Rolling System
- Support for standard D&D dice (d4, d6, d8, d10, d12, d20)
- Modifier application for skill checks
- Automatic result interpretation by AI DM
- Roll history tracking

### 5. Inventory Management
- Item creation and categorization (weapon, armor, potion, misc)
- Quantity tracking
- Item descriptions and metadata
- Per-character inventory isolation

### 6. Real-time Chat Interface
- Message threading between player and AI DM
- Rich message types (text, dice rolls, system messages)
- Auto-scrolling chat area
- Quick action buttons for common D&D actions

## Data Flow

### 1. Character Creation Flow
```
User Input → Form Validation (Zod) → API Request → Character Storage → Session Creation
```

### 2. Game Interaction Flow
```
Player Action → Message API → Context Building → OpenAI API → DM Response → State Update → UI Refresh
```

### 3. Dice Rolling Flow
```
Dice Selection → Roll Generation → Result Storage → Context to AI → Story Integration
```

### 4. Inventory Management Flow
```
Item Creation → Validation → Character Association → Storage → UI Update
```

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection (Neon Database)
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **drizzle-orm**: Database ORM and query builder
- **openai**: AI integration for dungeon master responses
- **zod**: Runtime type validation and schema definition

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### UI Component System
- Complete Shadcn/ui component library
- Consistent design system with fantasy theming
- Responsive design for mobile and desktop
- Dark/light mode support

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Assets**: Static assets and components served by Express in production

### Environment Configuration
- **Development**: Vite dev server with HMR and Express API routes
- **Production**: Express serves static frontend and API routes
- **Database**: Environment variable configuration for PostgreSQL connection

### Scripts
- `npm run dev`: Development mode with hot reload
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server startup
- `npm run db:push`: Database schema deployment

### Database Setup
- Drizzle migrations stored in `./migrations`
- Schema definition in `./shared/schema.ts`
- PostgreSQL dialect with UUID primary keys
- Automatic timestamp tracking for entities

The application is designed to be deployed on Replit with seamless integration between development and production environments, automatic database provisioning, and real-time collaborative features.
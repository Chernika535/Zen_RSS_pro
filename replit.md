# RSS to Zen Bridge Service

## Overview

RSS to Zen Bridge is a full-stack web application that automates the process of fetching RSS feeds, processing articles for Yandex Zen compliance, and generating clean RSS output. The system provides a dashboard for monitoring article processing, managing RSS configuration, and tracking system statistics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using **React 18** with **TypeScript** and follows modern React patterns:

- **UI Framework**: Uses shadcn/ui component library with Radix UI primitives for consistent, accessible components
- **Styling**: Tailwind CSS with CSS custom properties for theming and design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Component Structure**: Modular component architecture with reusable UI components

The application uses a dark theme by default with comprehensive CSS custom properties for consistent styling across components.

### Backend Architecture
The backend follows an **Express.js** API server pattern with TypeScript:

- **Framework**: Express.js with TypeScript for type safety
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Storage Pattern**: Interface-based storage with in-memory implementation (MemStorage class) that can be easily swapped for database persistence
- **Service Layer**: Separated business logic into service classes (RSSProcessor, ZenRSSGenerator)
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage Solutions
The application uses a flexible storage architecture:

- **Database**: PostgreSQL configured through Drizzle ORM
- **Schema Management**: Drizzle migrations with schema definitions in TypeScript
- **Connection**: Neon Database serverless PostgreSQL connection
- **Fallback Storage**: In-memory storage implementation for development/testing

Database schema includes three main entities:
- `articles`: Core article data with processing status tracking
- `rss_config`: RSS feed configuration and settings
- `processing_stats`: System performance metrics and statistics

### Authentication and Authorization
Currently, the application does not implement authentication mechanisms. The system assumes trusted internal usage without user management or access controls.

### Processing Pipeline
The application implements a multi-stage article processing pipeline:

1. **RSS Fetching**: Uses `rss-parser` to fetch and parse RSS feeds
2. **Content Processing**: Extracts and cleans article content using JSDOM
3. **Zen Compliance**: Validates articles against Yandex Zen requirements
4. **Status Tracking**: Maintains processing states (pending, processing, processed, error)
5. **RSS Generation**: Creates clean RSS output for processed articles

The system supports automatic scheduling and manual triggering of the processing pipeline.

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **RSS Sources**: External RSS feeds (configurable source URLs)

### Key Libraries and Frameworks
- **Frontend**: React, TypeScript, Vite, TanStack Query, Wouter, Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Express.js, TypeScript, Drizzle ORM, rss-parser, JSDOM
- **Database**: PostgreSQL via Neon Database serverless
- **Development**: ESBuild for server bundling, PostCSS for CSS processing

### API Integrations
The system is designed to integrate with Yandex Zen publishing APIs, though specific implementation details may vary based on Zen's current API specifications.

### Infrastructure Dependencies
- **Node.js Runtime**: ES modules with TypeScript compilation
- **Environment Variables**: DATABASE_URL for PostgreSQL connection
- **File System**: Temporary storage for processing intermediate files
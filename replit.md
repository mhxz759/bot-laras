# ZynBank Fintech Application

## Overview

ZynBank is a modern fintech application designed with simplicity, security, and innovation in mind. The system operates as a full-stack web application with distinct user and administrative interfaces. Users can receive payments through PIX integration with automatic fee deduction (8%), request manual withdrawals (R$2 fee), and track their financial history. Administrators have complete oversight with user management, withdrawal approval workflows, and comprehensive financial reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom ZynBank theme (blue, black, white color scheme)
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation schemas
- **Authentication**: Context-based auth provider with JWT token storage

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based access control
- **Authentication**: JWT-based authentication with middleware protection
- **Password Security**: bcrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Connection Handling**: Connection pooling through Neon serverless client

### Database Schema Design
- **Users**: Core user information with role-based access (user/admin)
- **Transactions**: Financial movement tracking with type classification (receive/withdraw/fee)
- **Withdrawals**: Manual withdrawal requests with admin approval workflow
- **PIX Payments**: PIX transaction integration with external payment provider
- **Activity Logs**: Comprehensive audit trail for security and compliance

### Authentication and Authorization
- **User Registration**: Multi-step validation with CPF and phone verification
- **Login System**: Email/password authentication with JWT token generation
- **Role-Based Access**: Distinct user and admin interfaces with middleware protection
- **Session Security**: Secure token storage with automatic expiration handling

### External Dependencies

#### Payment Integration
- **CredPix API**: External PIX payment processor for QR code generation and payment verification
- **API Token**: Secured API key management for payment gateway communication
- **Payment Flow**: Real-time payment status monitoring with webhook support

#### Development and Deployment
- **Replit Environment**: Integrated development environment with hot reloading
- **Vite Development Server**: Fast development builds with HMR support
- **PostCSS**: CSS processing pipeline with Tailwind CSS compilation
- **ESBuild**: Production bundling for optimized server deployment

#### UI and Design System
- **Google Fonts**: Inter font family for modern typography
- **Lucide Icons**: Comprehensive icon library for UI elements
- **Radix UI Primitives**: Accessible component primitives for complex interactions
- **Class Variance Authority**: Type-safe styling variants for component systems

#### Database and Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time connection capabilities through ws library
- **Environment Configuration**: Secure environment variable management for database URLs and API keys
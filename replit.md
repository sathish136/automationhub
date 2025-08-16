# AutomationHub - Industrial Site Monitoring System

## Overview

AutomationHub is a comprehensive industrial automation monitoring and management system built specifically for Beckhoff TwinCAT environments. The application provides real-time monitoring of automation sites, network equipment management, program backup capabilities, VFD parameter tracking, and secure credential management for industrial PCs. It features a modern web interface with a Node.js/Express backend and PostgreSQL database, designed to handle critical industrial infrastructure monitoring with uptime tracking, alerting, and reporting capabilities.

## Recent Changes

- **Site Events Page Added (December 2024)**: Implemented comprehensive event management interface for viewing, filtering, and managing site alerts and system events with real-time updates and status management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **Routing**: Wouter for client-side routing with single-page application architecture
- **State Management**: TanStack Query (React Query) for server state management with caching and synchronization
- **UI Framework**: Radix UI primitives with Tailwind CSS for styling and shadcn/ui component system
- **Design System**: Custom design tokens with CSS variables for theming, supporting both light and dark modes

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture with structured endpoints for sites, equipment, backups, and credentials
- **File Uploads**: Multer middleware for handling program backup file uploads with 50MB size limits
- **Monitoring**: Automated ping service using native system ping commands with cron scheduling
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Management**: Migration-based database versioning with schema definitions in shared TypeScript files
- **Connection Pooling**: Neon serverless connection pooling for optimal performance

### Database Schema Design
- **Sites**: Core entity tracking IP addresses, status, uptime metrics, and site metadata
- **Uptime History**: Time-series data for historical monitoring and analytics
- **Program Backups**: File metadata and storage for HMI/PLC program backups
- **Network Equipment**: Router and modem tracking with status monitoring
- **IPC Credentials**: Encrypted credential storage with bcrypt hashing
- **VFD Parameters**: Variable frequency drive configuration and monitoring data
- **Alerts**: Notification system with severity levels and acknowledgment tracking

### Authentication and Authorization
- **Password Security**: bcrypt for credential hashing with salt rounds
- **Session Management**: Built-in Express session handling
- **Access Control**: Role-based access patterns for different system components

### Monitoring and Alerting
- **Ping Monitoring**: Automated site connectivity monitoring with configurable intervals
- **Status Tracking**: Real-time status updates for sites and equipment
- **Alert System**: Multi-level alert system (critical, warning, info, success)
- **Response Time Tracking**: Network latency monitoring and historical data
- **Uptime Calculations**: Automated uptime percentage calculations with time-based aggregations

### File Management
- **Upload Handling**: Secure file upload system for program backups
- **Storage**: Local file system storage with configurable upload directory
- **File Validation**: Type and size validation for uploaded program files

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tooling

### UI and Component Libraries
- **Radix UI**: Headless component primitives for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for type-safe data handling

### Backend Services
- **Express.js**: Web framework for API routing and middleware
- **Multer**: File upload middleware for handling multipart/form-data
- **node-cron**: Scheduled task execution for monitoring services
- **ws**: WebSocket library for Neon database connections

### Development Tools
- **Vite**: Build tool and development server with hot module replacement
- **TypeScript**: Type safety and enhanced developer experience
- **ESBuild**: Fast JavaScript bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### Monitoring and System Integration
- **Native Ping**: System-level ping commands for network connectivity testing
- **Process Management**: Child process spawning for system command execution
- **Cron Scheduling**: Time-based job scheduling for automated monitoring tasks
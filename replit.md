# AutomationHub - Industrial Site Monitoring System

## Overview

AutomationHub is a comprehensive industrial automation monitoring and management system built specifically for Beckhoff TwinCAT environments. The application provides real-time monitoring of automation sites, network equipment management, program backup capabilities, VFD parameter tracking, and secure credential management for industrial PCs. It features a modern web interface with a Node.js/Express backend and PostgreSQL database, designed to handle critical industrial infrastructure monitoring with uptime tracking, alerting, and reporting capabilities.

## Recent Changes

- **Site Events Database Configuration with Dropdowns (August 2025)**: Added comprehensive database configuration tab to IPC Management with dropdown selectors for database and table selection. Created DatabaseSelector and TableSelector components that fetch available databases and tables from existing SQL viewer APIs. Implemented intelligent fallback to manual text input when database connections fail. Enhanced both new IPC creation and editing workflows with automatic table reset when database changes. Added proper error handling and empty state management.
- **PLC I/O Calculations System Added (August 2025)**: Implemented comprehensive PLC I/O calculation management system specifically designed for Beckhoff TwinCAT environments. Added complete database schema for calculations including formula management, variable mapping, execution intervals, priority settings, and validation ranges. Created full CRUD operations with backend API routes and storage methods. Integrated professional form-based interface with site-specific filtering, active/inactive status control, and calculation examples tailored for industrial automation systems.
- **Reports and Settings Pages Removed (August 2025)**: Cleaned up application navigation by removing Reports and Settings pages to streamline the interface focus on core industrial monitoring and automation functionality.
- **Comprehensive Program & HMI Backup Management System (August 2025)**: Implemented complete backup management with enhanced tracking including compilation status, detailed user information (who created/uploaded/modified), upload functionality, categorization with tags, platform support (TwinCAT, CodeSys), file size tracking, and comprehensive metadata. Renamed from "Program Backups" to "Program & HMI Backups" with separate tabs for organization. Added complete database schema with new fields for compile errors, warnings, creator tracking, comments, and backup source tracking.
- **Removed PLC Tag Management and VFD Parameter Pages (August 2025)**: Completely removed PLC Tag Management and VFD Parameter functionality to streamline application focus solely on SQL viewing and backup management. Cleaned navigation, removed backend API routes, and eliminated database schema references.
- **SQL Viewer Auto-Sort by Recent Data (August 2025)**: Fixed all tables to automatically display most recent data first by default. Implemented date_time DESC as default sort order, ensuring newest entries appear at top without manual sorting. Both database queries and demo data now start with recent-first sorting. Fixed initial state to show proper sort arrows and maintain consistent behavior across all table types.
- **SQL Viewer Database-Level Sorting (August 2025)**: Implemented server-side sorting functionality that queries the entire database instead of sorting only loaded data. Backend now accepts sortColumn and sortDirection parameters, constructs SQL ORDER BY clauses with proper validation, and frontend sends sort requests to server. This enables sorting across complete datasets rather than limiting to visible rows.
- **SQL Viewer S.No and Date Formatting (August 2025)**: Added serial number column (S.No) to all tables with 60px width, formatted date_time columns to DD/MM/YYYY HH:MM:SS format, changed "date_time" header to "Date & Time" with 150px width, and applied changes to both live data and demo data tables.
- **SQL Viewer Table Layout Fix (August 2025)**: Fixed horizontal scrolling issue by implementing proper table container with overflow-x-auto, set minimum column widths (120px) with auto expansion, added whitespace-nowrap to prevent text wrapping, and removed problematic flex-1 layout. Table now displays within viewport bounds with contained horizontal scrolling when needed.
- **SQL Viewer Enhanced Design (August 2025)**: Completed major redesign with frozen table headers, compact spacing, advanced filtering system, and improved data presentation. Removed scrolling in favor of auto-fit layout, implemented row limiting (25/50/100/200), enhanced search across all columns, and added column-specific filtering. Table now displays industrial data columns (date_time, rej_recovery, rej_feed, rej_1st_db, etc.) with professional alternating row design and full-width layout for maximum space utilization.
- **Project Migration to Replit Completed (August 2025)**: Successfully migrated the industrial automation monitoring system from Replit Agent to standard Replit environment. Fixed package dependencies, installed Python dependencies for ADS monitoring, configured PostgreSQL database with schema migration, eliminated demo data fallbacks, and established working connections to external SQL Server databases. The system now successfully displays authentic industrial data including site events, alerts, and monitoring data from real production databases. Site Events page now properly connects to bhilwara.bhilwara_alerts table showing actual equipment alerts like "BIO - AB2 Tripped" and "MBR - Drain Pump 2 Trip".
- **Network Equipment and Communication Systems Removed (December 2024)**: Completely removed network equipment management, communication interfaces, and instrument data functionality from the system. This included deleting database tables (networkEquipment, communicationInterfaces, instrumentData, communicationLogs), removing API endpoints, cleaning up frontend pages and navigation. The system now focuses on core industrial automation monitoring.
- **PLC Tags Page Redesigned (August 2024)**: Completely redesigned PLC Tag Monitoring page to match IPC Management page style with proper font sizes, added bulk upload functionality for CSV data import, improved UI consistency with other management pages.
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
- **IPC Credentials**: Encrypted credential storage with bcrypt hashing
- **VFD Parameters**: Variable frequency drive configuration and monitoring data
- **PLC Tags**: PLC tag monitoring and historical data tracking
- **Projects**: Project management and planning functionality
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
import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sites table
export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ipAddress: varchar("ip_address", { length: 45 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("unknown"), // online, offline, warning, unknown
  responseTime: integer("response_time"), // in milliseconds
  uptime: decimal("uptime", { precision: 5, scale: 2 }).default("0"), // percentage
  lastCheck: timestamp("last_check"),
  lastOnline: timestamp("last_online"),
  siteType: varchar("site_type", { length: 50 }).default("production"), // production, development, warehouse
  location: varchar("location", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sites_status").on(table.status),
  index("idx_sites_ip").on(table.ipAddress),
]);

// Uptime history for tracking historical data
export const uptimeHistory = pgTable("uptime_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull(),
  responseTime: integer("response_time"),
  isOnline: boolean("is_online").notNull(),
}, (table) => [
  index("idx_uptime_site_timestamp").on(table.siteId, table.timestamp),
]);

// Program backups (HMI and PLC) with detailed tracking
export const programBackups = pgTable("program_backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(), // program, hmi
  version: varchar("version", { length: 50 }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"), // in bytes
  checksum: varchar("checksum", { length: 64 }),
  platform: varchar("platform", { length: 50 }).default("twincat"), // twincat, codesys, other
  
  // Enhanced tracking fields
  backupType: varchar("backup_type", { length: 20 }).notNull().default("manual"), // manual, scheduled, automatic
  compileStatus: varchar("compile_status", { length: 20 }).default("unknown"), // success, failed, warning, unknown
  compileErrors: text("compile_errors"), // Compilation error details
  compileWarnings: text("compile_warnings"), // Compilation warnings
  
  // Who and when details
  createdBy: varchar("created_by", { length: 255 }).notNull(), // Username or system identifier
  createdByEmail: varchar("created_by_email", { length: 255 }),
  uploadedBy: varchar("uploaded_by", { length: 255 }), // Person who uploaded (if different)
  modifiedBy: varchar("modified_by", { length: 255 }), // Last person to modify
  
  // Additional metadata
  comments: text("comments"), // User comments about the backup
  tags: varchar("tags", { length: 500 }), // Comma-separated tags for categorization
  isActive: boolean("is_active").default(true), // Whether this backup is currently active/deployed
  backupSource: varchar("backup_source", { length: 100 }).default("upload"), // upload, auto_backup, scheduled
  originalPath: varchar("original_path", { length: 500 }), // Original file path before backup
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_backups_site").on(table.siteId),
  index("idx_backups_type").on(table.type),
  index("idx_backups_created_by").on(table.createdBy),
  index("idx_backups_active").on(table.isActive),
  index("idx_backups_compile_status").on(table.compileStatus),
]);


// IPC management
export const ipcManagement = pgTable("ipc_management", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").references(() => sites.id, { onDelete: "cascade" }),
  
  // Basic Details
  deviceName: varchar("device_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("Active"), // Active, Inactive, Maintenance, Offline
  amsNetId: varchar("ams_net_id", { length: 50 }).notNull(),
  vpnIp: varchar("vpn_ip", { length: 45 }),
  lanIp: varchar("lan_ip", { length: 45 }),
  anydesk: varchar("anydesk", { length: 100 }),
  teamviewer: varchar("teamviewer", { length: 100 }),
  anydeskPassword: varchar("anydesk_password", { length: 255 }),
  namingSeries: varchar("naming_series", { length: 100 }),
  ipcUsername: varchar("ipc_username", { length: 100 }),
  ipcPassword: varchar("ipc_password", { length: 255 }), // encrypted
  comments: text("comments"),

  // Hardware Specs - IPC CPU
  manufacture: varchar("manufacture", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNo: varchar("serial_no", { length: 100 }),
  mainboard: varchar("mainboard", { length: 100 }),
  cpu: varchar("cpu", { length: 100 }),
  flash: varchar("flash", { length: 100 }),
  powerSupply: varchar("power_supply", { length: 100 }),
  memory: varchar("memory", { length: 100 }),
  mac1: varchar("mac1", { length: 17 }),
  mac2: varchar("mac2", { length: 17 }),
  operatingSystem: varchar("operating_system", { length: 100 }),
  imageVersion: varchar("image_version", { length: 100 }),
  ipcImage: varchar("ipc_image", { length: 500 }), // URL or path to IPC image
  serialNumberOfIpc: varchar("serial_number_of_ipc", { length: 100 }),
  deviceManagerVersion: varchar("device_manager_version", { length: 100 }),

  // Network 1
  network1Name: varchar("network1_name", { length: 100 }),
  network1VirtualDevice: varchar("network1_virtual_device", { length: 100 }),
  network1Gateway: varchar("network1_gateway", { length: 45 }),
  network1Address: varchar("network1_address", { length: 45 }),
  network1Dhcp: varchar("network1_dhcp", { length: 20 }),
  network1SubnetMask: varchar("network1_subnet_mask", { length: 45 }),
  network1DnsServers: varchar("network1_dns_servers", { length: 255 }),
  network1MacAddress: varchar("network1_mac_address", { length: 17 }),

  // Network 2
  network2Name: varchar("network2_name", { length: 100 }),
  network2VirtualDevice: varchar("network2_virtual_device", { length: 100 }),
  network2Gateway: varchar("network2_gateway", { length: 45 }),
  network2Address: varchar("network2_address", { length: 45 }),
  network2Dhcp: varchar("network2_dhcp", { length: 20 }),
  network2SubnetMask: varchar("network2_subnet_mask", { length: 45 }),
  network2DnsServers: varchar("network2_dns_servers", { length: 255 }),
  network2MacAddress: varchar("network2_mac_address", { length: 17 }),

  // Site Events Database Configuration
  eventsDatabaseName: varchar("events_database_name", { length: 100 }), // Database name for site events
  eventsTableName: varchar("events_table_name", { length: 100 }), // Table name for alerts (e.g., bhilwara_alerts)

  lastAccess: timestamp("last_access"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ipc_site").on(table.siteId),
  index("idx_ipc_ams_net_id").on(table.amsNetId),
  index("idx_ipc_status").on(table.status),
  index("idx_ipc_device_name").on(table.deviceName),
]);

// VFD parameters
export const vfdParameters = pgTable("vfd_parameters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  manufacturer: varchar("manufacturer", { length: 100 }),
  model: varchar("model", { length: 100 }),
  motorType: varchar("motor_type", { length: 100 }),
  frequency: decimal("frequency", { precision: 6, scale: 2 }), // Hz
  voltage: decimal("voltage", { precision: 6, scale: 2 }), // V
  current: decimal("current", { precision: 6, scale: 2 }), // A
  power: decimal("power", { precision: 8, scale: 2 }), // W
  rpm: integer("rpm"),
  loadPercentage: decimal("load_percentage", { precision: 5, scale: 2 }),
  parameters: jsonb("parameters"), // custom parameter object
  lastUpdate: timestamp("last_update"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_vfd_site").on(table.siteId),
  index("idx_vfd_active").on(table.isActive),
]);


// Alerts and notifications
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").references(() => sites.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // site_offline, high_response_time, backup_completed, equipment_failure, communication_error, plc_tag_alarm, plc_tag_trip
  severity: varchar("severity", { length: 20 }).notNull().default("info"), // critical, warning, info, success
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  metadata: jsonb("metadata"), // additional context data
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("idx_alerts_site").on(table.siteId),
  index("idx_alerts_type").on(table.type),
  index("idx_alerts_severity").on(table.severity),
  index("idx_alerts_created").on(table.createdAt),
]);

// PLC Tags to monitor
export const plcTags = pgTable("plc_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  tagName: varchar("tag_name", { length: 255 }).notNull(),
  plcAddress: varchar("plc_address", { length: 500 }).notNull(), // e.g., "GVL.M_HYPO_DOSING_PUMP_TRIP"
  description: text("description"),
  dataType: varchar("data_type", { length: 50 }).notNull().default("BOOL"), // BOOL, INT, REAL, STRING
  isActive: boolean("is_active").default(true),
  alarmOnTrue: boolean("alarm_on_true").default(true), // Create alarm when value becomes true
  alarmOnFalse: boolean("alarm_on_false").default(false), // Create alarm when value becomes false
  severityLevel: varchar("severity_level", { length: 20 }).default("warning"), // critical, warning, info
  lastValue: text("last_value"), // Store as string for all data types
  lastReadTime: timestamp("last_read_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_plc_tags_site").on(table.siteId),
  index("idx_plc_tags_active").on(table.isActive),
  index("idx_plc_tags_name").on(table.tagName),
]);

// PLC Tag History for tracking value changes
export const plcTagHistory = pgTable("plc_tag_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tagId: varchar("tag_id").notNull().references(() => plcTags.id, { onDelete: "cascade" }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("idx_plc_tag_history_tag").on(table.tagId),
  index("idx_plc_tag_history_timestamp").on(table.timestamp),
]);

// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
  uptimeHistory: many(uptimeHistory),
  programBackups: many(programBackups),
  ipcManagement: many(ipcManagement),
  vfdParameters: many(vfdParameters),
  alerts: many(alerts),
  plcTags: many(plcTags),
}));

export const uptimeHistoryRelations = relations(uptimeHistory, ({ one }) => ({
  site: one(sites, {
    fields: [uptimeHistory.siteId],
    references: [sites.id],
  }),
}));

export const programBackupsRelations = relations(programBackups, ({ one }) => ({
  site: one(sites, {
    fields: [programBackups.siteId],
    references: [sites.id],
  }),
}));

export const ipcManagementRelations = relations(ipcManagement, ({ one }) => ({
  site: one(sites, {
    fields: [ipcManagement.siteId],
    references: [sites.id],
  }),
}));

export const vfdParametersRelations = relations(vfdParameters, ({ one }) => ({
  site: one(sites, {
    fields: [vfdParameters.siteId],
    references: [sites.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  site: one(sites, {
    fields: [alerts.siteId],
    references: [sites.id],
  }),
}));

export const plcTagsRelations = relations(plcTags, ({ one, many }) => ({
  site: one(sites, {
    fields: [plcTags.siteId],
    references: [sites.id],
  }),
  history: many(plcTagHistory),
}));

export const plcTagHistoryRelations = relations(plcTagHistory, ({ one }) => ({
  tag: one(plcTags, {
    fields: [plcTagHistory.tagId],
    references: [plcTags.id],
  }),
}));


// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectNumber: varchar("project_number", { length: 100 }).notNull().unique(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("Planning"), // Planning, Active, In Progress, Completed
  capacity: varchar("capacity", { length: 100 }),
  ipcName: varchar("ipc_name", { length: 255 }),
  selectedIpcId: varchar("selected_ipc_id").references(() => ipcManagement.id),
  selectedSystems: varchar("selected_systems").array().default(sql`ARRAY[]::text[]`),
  createdDate: timestamp("created_date").defaultNow(),
  planStartDate: timestamp("plan_start_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_projects_number").on(table.projectNumber),
  index("idx_projects_status").on(table.status),
]);

export const projectsRelations = relations(projects, ({ one }) => ({
  selectedIpc: one(ipcManagement, {
    fields: [projects.selectedIpcId],
    references: [ipcManagement.id],
  }),
}));

// ================================
// AUTOMATION WIZARD SCHEMA ENHANCEMENTS
// ================================

// Automation Projects - Main container for automation planning
export const automationProjects = pgTable("automation_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // Project Information
  projectName: varchar("project_name", { length: 255 }).notNull(),
  projectDescription: text("project_description"),
  projectType: varchar("project_type", { length: 50 }).default("greenfield"), // greenfield, brownfield, upgrade
  
  // Project Structure
  mainControllerId: varchar("main_controller_id"), // Reference to main PLC
  totalPanels: integer("total_panels").default(0),
  totalDevices: integer("total_devices").default(0),
  
  // Planning Status
  wizardStep: integer("wizard_step").default(1), // Current step in wizard (1-8)
  isCompleted: boolean("is_completed").default(false),
  completionDate: timestamp("completion_date"),
  
  // Cost and Timeline
  estimatedBudget: decimal("estimated_budget", { precision: 12, scale: 2 }),
  actualBudget: decimal("actual_budget", { precision: 12, scale: 2 }),
  plannedStartDate: timestamp("planned_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_automation_projects_site").on(table.siteId),
  index("idx_automation_projects_step").on(table.wizardStep),
]);

// Beckhoff Product Catalog
export const beckhoffProducts = pgTable("beckhoff_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Product Identification
  partNumber: varchar("part_number", { length: 50 }).notNull().unique(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productDescription: text("product_description"),
  
  // Product Category
  category: varchar("category", { length: 50 }).notNull(), // controller, coupler, digital_io, analog_io, communication, power
  subcategory: varchar("subcategory", { length: 50 }), // main_controller, remote_coupler, di_module, do_module, ai_module, ao_module
  
  // Technical Specifications
  ioCount: integer("io_count").default(0), // Number of I/O channels
  ioType: varchar("io_type", { length: 30 }), // DI, DO, AI, AO, MIXED
  signalType: varchar("signal_type", { length: 50 }), // 24VDC, 4-20mA, 0-10V, PT100, etc.
  maxCurrent: decimal("max_current", { precision: 8, scale: 2 }), // mA
  resolution: integer("resolution"), // bits for analog modules
  
  // Physical Properties
  dimensions: jsonb("dimensions"), // {width, height, depth} in mm
  weight: decimal("weight", { precision: 6, scale: 3 }), // kg
  mountingType: varchar("mounting_type", { length: 30 }).default("din_rail"),
  
  // Network and Communication
  communicationProtocol: varchar("communication_protocol", { length: 50 }), // EtherCAT, RS485, Profinet
  maxDistance: integer("max_distance"), // Maximum cable distance in meters
  dataRate: varchar("data_rate", { length: 30 }), // Communication speed
  
  // Power Requirements
  powerConsumption: decimal("power_consumption", { precision: 8, scale: 2 }), // Watts
  supplyVoltage: varchar("supply_voltage", { length: 30 }), // 24VDC, 230VAC
  
  // Compatibility and Configuration
  compatibleCouplers: varchar("compatible_couplers").array().default(sql`ARRAY[]::text[]`), // Array of compatible coupler part numbers
  configurationSoftware: varchar("configuration_software", { length: 100 }), // TwinCAT, etc.
  
  // Commercial Information
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  availabilityStatus: varchar("availability_status", { length: 30 }).default("available"),
  leadTime: integer("lead_time"), // days
  
  // Documentation
  datasheetUrl: varchar("datasheet_url", { length: 500 }),
  manualUrl: varchar("manual_url", { length: 500 }),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_beckhoff_products_part").on(table.partNumber),
  index("idx_beckhoff_products_category").on(table.category),
  index("idx_beckhoff_products_subcategory").on(table.subcategory),
  index("idx_beckhoff_products_io_type").on(table.ioType),
]);

// ================================
// USER MANAGEMENT AND AUTHENTICATION
// ================================

// Users table for authentication and user management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Authentication fields
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt hashed
  
  // Profile information
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  fullName: varchar("full_name", { length: 255 }), // computed field
  
  // Account status
  isActive: boolean("is_active").default(true),
  isEmailVerified: boolean("is_email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  
  // System tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_active").on(table.isActive),
]);

// Roles table for role-based access control
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Role definition
  name: varchar("name", { length: 50 }).notNull().unique(), // admin, engineer, operator, viewer
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Role permissions and configuration
  permissions: jsonb("permissions"), // JSON object with permission flags
  isSystemRole: boolean("is_system_role").default(false), // true for built-in roles
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_roles_name").on(table.name),
  index("idx_roles_active").on(table.isActive),
]);

// User roles junction table for many-to-many relationship
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  
  // Assignment tracking
  assignedBy: varchar("assigned_by").references(() => users.id), // who assigned this role
  assignedAt: timestamp("assigned_at").defaultNow(),
  
  // Temporary role assignment (optional)
  expiresAt: timestamp("expires_at"), // null for permanent assignment
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_roles_user").on(table.userId),
  index("idx_user_roles_role").on(table.roleId),
  // Unique constraint to prevent duplicate role assignments
  index("idx_user_roles_unique").on(table.userId, table.roleId),
]);

// Session management table
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Session data
  token: varchar("token", { length: 255 }).notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  
  // Session status
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  
  // Session expiry
  expiresAt: timestamp("expires_at").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sessions_token").on(table.token),
  index("idx_sessions_user").on(table.userId),
  index("idx_sessions_active").on(table.isActive),
  index("idx_sessions_expires").on(table.expiresAt),
]);

// User management relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  sessions: many(sessions),
  assignedRoles: many(userRoles, { relationName: "assignedBy" }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: "assignedBy",
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ================================
// MULTI-VENDOR AUTOMATION SUPPORT
// ================================

// Automation Vendors - Support multiple vendors (Beckhoff, Siemens, Allen-Bradley, etc.)
export const automationVendors = pgTable("automation_vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Vendor Information
  vendorName: varchar("vendor_name", { length: 100 }).notNull().unique(),
  vendorDisplayName: varchar("vendor_display_name", { length: 100 }).notNull(),
  vendorDescription: text("vendor_description"),
  
  // Vendor Details
  country: varchar("country", { length: 50 }),
  website: varchar("website", { length: 255 }),
  supportEmail: varchar("support_email", { length: 255 }),
  
  // Visual
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 7 }), // Hex color
  
  // Status
  isActive: boolean("is_active").default(true),
  isPreferred: boolean("is_preferred").default(false), // Highlight preferred vendors
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_automation_vendors_name").on(table.vendorName),
  index("idx_automation_vendors_active").on(table.isActive),
]);

// Generic Automation Products - Replaces beckhoffProducts with multi-vendor support
export const automationProducts = pgTable("automation_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => automationVendors.id, { onDelete: "cascade" }),
  
  // Product Identification
  partNumber: varchar("part_number", { length: 100 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productDisplayName: varchar("product_display_name", { length: 255 }).notNull(), // User-friendly name
  productDescription: text("product_description"),
  detailedDescription: text("detailed_description"), // More comprehensive description
  
  // Product Category
  category: varchar("category", { length: 50 }).notNull(), // controller, io_module, communication, power, sensor, actuator
  subcategory: varchar("subcategory", { length: 50 }), // plc_controller, hmi_panel, di_module, do_module, ai_module, ao_module
  productFamily: varchar("product_family", { length: 100 }), // S7-1200, CompactLogix, CX-series, etc.
  
  // Technical Specifications
  ioCount: integer("io_count").default(0), // Number of I/O channels
  ioType: varchar("io_type", { length: 30 }), // DI, DO, AI, AO, MIXED
  signalType: varchar("signal_type", { length: 50 }), // 24VDC, 4-20mA, 0-10V, PT100, etc.
  signalRange: varchar("signal_range", { length: 100 }), // e.g., "0-24V DC", "4-20mA", "0-10V"
  maxCurrent: decimal("max_current", { precision: 8, scale: 2 }), // mA
  resolution: integer("resolution"), // bits for analog modules
  accuracy: varchar("accuracy", { length: 50 }), // e.g., "±0.1%", "±1 LSB"
  
  // Physical Properties
  dimensions: jsonb("dimensions"), // {width, height, depth} in mm
  weight: decimal("weight", { precision: 6, scale: 3 }), // kg
  mountingType: varchar("mounting_type", { length: 50 }).default("din_rail"),
  operatingTemperature: varchar("operating_temperature", { length: 50 }), // e.g., "-25°C to +60°C"
  protectionRating: varchar("protection_rating", { length: 10 }), // IP20, IP65, etc.
  
  // Network and Communication
  communicationProtocol: varchar("communication_protocol", { length: 50 }), // EtherCAT, PROFINET, EtherNet/IP
  maxDistance: integer("max_distance"), // Maximum cable distance in meters
  dataRate: varchar("data_rate", { length: 30 }), // Communication speed
  networkPorts: integer("network_ports").default(0),
  
  // Power Requirements
  powerConsumption: decimal("power_consumption", { precision: 8, scale: 2 }), // Watts
  supplyVoltage: varchar("supply_voltage", { length: 50 }), // 24VDC, 230VAC
  currentConsumption: decimal("current_consumption", { precision: 8, scale: 3 }), // A
  
  // Software and Configuration
  configurationSoftware: varchar("configuration_software", { length: 100 }), // TwinCAT, TIA Portal, Studio 5000
  programmingLanguages: varchar("programming_languages").array().default(sql`ARRAY[]::text[]`), // IEC 61131-3 languages
  supportedProtocols: varchar("supported_protocols").array().default(sql`ARRAY[]::text[]`), // Array of supported protocols
  compatibleProducts: varchar("compatible_products").array().default(sql`ARRAY[]::text[]`), // Compatible part numbers
  
  // Commercial Information
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  availabilityStatus: varchar("availability_status", { length: 30 }).default("available"),
  leadTime: integer("lead_time"), // days
  minimumOrderQuantity: integer("minimum_order_quantity").default(1),
  
  // Documentation and Support
  datasheetUrl: varchar("datasheet_url", { length: 500 }),
  manualUrl: varchar("manual_url", { length: 500 }),
  videoUrl: varchar("video_url", { length: 500 }), // Product demo/tutorial videos
  supportLevel: varchar("support_level", { length: 30 }).default("standard"), // basic, standard, premium
  
  // User Experience
  difficultyLevel: varchar("difficulty_level", { length: 20 }).default("intermediate"), // beginner, intermediate, advanced
  popularityScore: integer("popularity_score").default(0), // For sorting/recommendations
  userRating: decimal("user_rating", { precision: 3, scale: 2 }), // 0.00 to 5.00
  
  // Features and Benefits
  keyFeatures: varchar("key_features").array().default(sql`ARRAY[]::text[]`), // Array of key features
  benefits: varchar("benefits").array().default(sql`ARRAY[]::text[]`), // Array of benefits
  applicationAreas: varchar("application_areas").array().default(sql`ARRAY[]::text[]`), // Typical applications
  
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false), // Highlight featured products
  isRecommended: boolean("is_recommended").default(false), // Recommended products
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_automation_products_vendor").on(table.vendorId),
  index("idx_automation_products_part").on(table.partNumber),
  index("idx_automation_products_category").on(table.category),
  index("idx_automation_products_subcategory").on(table.subcategory),
  index("idx_automation_products_io_type").on(table.ioType),
  index("idx_automation_products_family").on(table.productFamily),
  index("idx_automation_products_featured").on(table.isFeatured),
  index("idx_automation_products_recommended").on(table.isRecommended),
]);

// Relations for vendor and product tables
export const automationVendorsRelations = relations(automationVendors, ({ many }) => ({
  products: many(automationProducts),
}));

export const automationProductsRelations = relations(automationProducts, ({ one }) => ({
  vendor: one(automationVendors, {
    fields: [automationProducts.vendorId],
    references: [automationVendors.id],
  }),
}));

// Enhanced Automation Panels with hierarchy support
export const automationPanels = pgTable("automation_panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => automationProjects.id, { onDelete: "cascade" }),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // Panel Hierarchy
  panelType: varchar("panel_type", { length: 50 }).notNull(), // main_controller, sub_panel, remote_io
  parentPanelId: varchar("parent_panel_id"), // Self-reference - will add constraint later
  hierarchyLevel: integer("hierarchy_level").default(1), // 1 = main, 2 = sub, 3 = remote
  
  // Panel Information
  panelName: varchar("panel_name", { length: 100 }).notNull(),
  panelDescription: text("panel_description"),
  panelLocation: varchar("panel_location", { length: 255 }),
  
  // Physical Configuration
  cabinetSize: varchar("cabinet_size", { length: 50 }),
  enclosureRating: varchar("enclosure_rating", { length: 20 }).default("IP54"),
  
  // Product Configuration (Generic - supports all vendors)
  mainControllerId: varchar("main_controller_id").references(() => automationProducts.id),
  couplerId: varchar("coupler_id").references(() => automationProducts.id),
  powerSupplyId: varchar("power_supply_id").references(() => automationProducts.id),
  
  // Network Configuration
  distanceFromMain: integer("distance_from_main"), // meters
  communicationType: varchar("communication_type", { length: 50 }), // EtherCAT, RS485, Profinet
  networkAddress: varchar("network_address", { length: 50 }),
  
  // I/O Summary (calculated from devices)
  totalDigitalInputs: integer("total_digital_inputs").default(0),
  totalDigitalOutputs: integer("total_digital_outputs").default(0),
  totalAnalogInputs: integer("total_analog_inputs").default(0),
  totalAnalogOutputs: integer("total_analog_outputs").default(0),
  
  // Cost and Status
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  installationStatus: varchar("installation_status", { length: 30 }).default("planned"),
  
  // 3D/2D Visualization
  position3d: jsonb("position_3d"), // {x, y, z} coordinates
  panelDrawing: varchar("panel_drawing", { length: 500 }), // Path to drawing file
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_automation_panels_project").on(table.projectId),
  index("idx_automation_panels_type").on(table.panelType),
  index("idx_automation_panels_parent").on(table.parentPanelId),
]);

// Communication Modules (RS485, Profinet, etc.)
export const communicationModules = pgTable("communication_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => automationProjects.id, { onDelete: "cascade" }),
  panelId: varchar("panel_id").references(() => automationPanels.id),
  
  // Module Information
  moduleName: varchar("module_name", { length: 100 }).notNull(),
  moduleType: varchar("module_type", { length: 50 }).notNull(), // RS485, Profinet, DeviceNet, CANopen
  automationProductId: varchar("automation_product_id").references(() => automationProducts.id),
  
  // Communication Configuration
  protocol: varchar("protocol", { length: 50 }).notNull(),
  baudRate: integer("baud_rate"), // For serial communications
  parity: varchar("parity", { length: 10 }), // none, even, odd
  stopBits: integer("stop_bits"),
  dataBits: integer("data_bits"),
  
  // Network Settings
  networkAddress: varchar("network_address", { length: 50 }),
  subnetMask: varchar("subnet_mask", { length: 50 }),
  gatewayAddress: varchar("gateway_address", { length: 50 }),
  
  // Connected Devices
  connectedDevices: jsonb("connected_devices"), // Array of device configurations
  maxDevices: integer("max_devices"),
  
  // Status
  configurationComplete: boolean("configuration_complete").default(false),
  testingComplete: boolean("testing_complete").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_comm_modules_project").on(table.projectId),
  index("idx_comm_modules_panel").on(table.panelId),
  index("idx_comm_modules_type").on(table.moduleType),
]);

// Enhanced Device Templates for automation wizard
export const automationDeviceTemplates = pgTable("automation_device_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template Information
  templateName: varchar("template_name", { length: 100 }).notNull(),
  deviceType: varchar("device_type", { length: 50 }).notNull(), // motor, pump, valve, flow_meter, level_sensor, etc.
  category: varchar("category", { length: 30 }).notNull(), // actuator, sensor, drive, protection
  subcategory: varchar("subcategory", { length: 50 }), // centrifugal_pump, ball_valve, magnetic_flow_meter
  
  // I/O Requirements
  digitalInputs: jsonb("digital_inputs"), // {"run_feedback": "24VDC", "trip": "24VDC", "ready": "24VDC"}
  digitalOutputs: jsonb("digital_outputs"), // {"start": "24VDC", "stop": "24VDC", "reset": "24VDC"}
  analogInputs: jsonb("analog_inputs"), // {"flow_rate": "4-20mA", "temperature": "PT100"}
  analogOutputs: jsonb("analog_outputs"), // {"speed_setpoint": "4-20mA"}
  
  // Signal Specifications
  voltageLevel: varchar("voltage_level", { length: 20 }).default("24VDC"),
  powerRating: decimal("power_rating", { precision: 8, scale: 2 }), // kW
  
  // Beckhoff Module Recommendations
  recommendedModules: jsonb("recommended_modules"), // Specific Beckhoff part numbers
  moduleQuantities: jsonb("module_quantities"), // How many of each module
  
  // Communication Requirements
  communicationProtocol: varchar("communication_protocol", { length: 50 }), // Modbus, Profibus, etc.
  communicationModuleId: varchar("communication_module_id").references(() => beckhoffProducts.id),
  
  // Tag Generation
  tagPrefix: varchar("tag_prefix", { length: 20 }), // MOT_, PMP_, VLV_, FT_, LT_
  tagStructure: text("tag_structure"), // Template for automatic tag generation
  
  // Physical Properties
  typicalInstallation: varchar("typical_installation", { length: 100 }), // Field, Panel, Rack
  environmentalRating: varchar("environmental_rating", { length: 20 }), // IP65, NEMA 4X
  
  // Documentation and Standards
  description: text("description"),
  applicationNotes: text("application_notes"),
  safetyRequirements: text("safety_requirements"),
  maintenanceNotes: text("maintenance_notes"),
  
  // Commercial Information
  typicalCost: decimal("typical_cost", { precision: 10, scale: 2 }),
  leadTime: integer("lead_time"), // days
  
  // Visualization
  symbolPath: varchar("symbol_path", { length: 500 }), // Path to 2D symbol
  model3dPath: varchar("model_3d_path", { length: 500 }), // Path to 3D model
  
  isStandard: boolean("is_standard").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_automation_device_templates_type").on(table.deviceType),
  index("idx_automation_device_templates_category").on(table.category),
  index("idx_automation_device_templates_standard").on(table.isStandard),
]);

// Insert schemas
export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUptimeHistorySchema = createInsertSchema(uptimeHistory).omit({
  id: true,
  timestamp: true,
});

export const insertProgramBackupSchema = createInsertSchema(programBackups).omit({
  id: true,
  createdAt: true,
});



export const insertIpcManagementSchema = createInsertSchema(ipcManagement, {
  siteId: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amsNetId: z.string().min(1, "AMS Net ID is required"),
  deviceName: z.string().min(1, "Device name is required"),
});

export const insertVfdParameterSchema = createInsertSchema(vfdParameters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertPlcTagSchema = createInsertSchema(plcTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastReadTime: true,
});

export const insertPlcTagHistorySchema = createInsertSchema(plcTagHistory).omit({
  id: true,
  timestamp: true,
});

// User management insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Role name is required"),
  displayName: z.string().min(1, "Display name is required"),
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
  assignedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  lastActivity: true,
});

// Types
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type UptimeHistory = typeof uptimeHistory.$inferSelect;
export type InsertUptimeHistory = z.infer<typeof insertUptimeHistorySchema>;
export type ProgramBackup = typeof programBackups.$inferSelect;
export type InsertProgramBackup = z.infer<typeof insertProgramBackupSchema>;

export type IpcManagement = typeof ipcManagement.$inferSelect;
export type InsertIpcManagement = z.infer<typeof insertIpcManagementSchema>;
export type VfdParameter = typeof vfdParameters.$inferSelect;
export type InsertVfdParameter = z.infer<typeof insertVfdParameterSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type PlcTag = typeof plcTags.$inferSelect;
export type InsertPlcTag = z.infer<typeof insertPlcTagSchema>;
export type PlcTagHistory = typeof plcTagHistory.$inferSelect;
export type InsertPlcTagHistory = z.infer<typeof insertPlcTagHistorySchema>;

// User management types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Site Database Tags (Real-time ADS monitoring)
export const siteDatabaseTags = pgTable("site_database_tags", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  tagName: text("tag_name").notNull(),
  adsPath: text("ads_path").notNull(), // ADS symbol path
  dataType: text("data_type").notNull(), // BOOL, INT, DINT, REAL, STRING, etc.
  description: text("description"),
  unit: text("unit"), // e.g., "°C", "bar", "rpm"
  isActive: boolean("is_active").default(true).notNull(),
  scanInterval: integer("scan_interval").default(2000).notNull(), // milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Site Database Values (Real-time data storage)
export const siteDatabaseValues = pgTable("site_database_values", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  tagId: text("tag_id").notNull().references(() => siteDatabaseTags.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  quality: text("quality").default("GOOD").notNull(), // GOOD, BAD, UNCERTAIN
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertSiteDatabaseTagSchema = createInsertSchema(siteDatabaseTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteDatabaseValueSchema = createInsertSchema(siteDatabaseValues).omit({
  id: true,
  timestamp: true,
});

export type SiteDatabaseTag = typeof siteDatabaseTags.$inferSelect;
export type InsertSiteDatabaseTag = z.infer<typeof insertSiteDatabaseTagSchema>;
export type SiteDatabaseValue = typeof siteDatabaseValues.$inferSelect;
export type InsertSiteDatabaseValue = z.infer<typeof insertSiteDatabaseValueSchema>;

// Real-time MBR Data Table (similar to sona1_reject_mbr from Python code)
export const mbrRealtimeData = pgTable("mbr_realtime_data", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // MBR Parameters
  mbrTmp: decimal("mbr_tmp", { precision: 8, scale: 2 }), // Temperature
  mbrFlow: decimal("mbr_flow", { precision: 8, scale: 2 }), // Flow rate
  mbrTankLevel: decimal("mbr_tank_level", { precision: 8, scale: 2 }), // Tank level
  mbrRunningTimeHrs: decimal("mbr_running_time_hrs", { precision: 8, scale: 2 }),
  mbrRunningTimeMin: decimal("mbr_running_time_min", { precision: 8, scale: 2 }),
  mbrRunningTimeSec: decimal("mbr_running_time_sec", { precision: 8, scale: 2 }),
  mbrBackwashWithoutFlow: decimal("mbr_backwash_without_flow", { precision: 8, scale: 2 }),
  turbidity: decimal("turbidity", { precision: 8, scale: 2 }),
  mbrPh: decimal("mbr_ph", { precision: 8, scale: 2 }),
  ctsPh: decimal("cts_ph", { precision: 8, scale: 2 }),
  mbrPt: decimal("mbr_pt", { precision: 8, scale: 2 }), // Pressure transmitter
  backwashWithoutCount: decimal("backwash_without_count", { precision: 8, scale: 2 }),
  backwashWithDrainFlow: decimal("backwash_with_drain_flow", { precision: 8, scale: 2 }),
  mbrPermeate: decimal("mbr_permeate", { precision: 8, scale: 2 }),
  mbrNetValueDay: decimal("mbr_net_value_day", { precision: 8, scale: 2 }),
  netValue: decimal("net_value", { precision: 8, scale: 2 }),
  h2so4: decimal("h2so4", { precision: 8, scale: 2 }),
  energy: decimal("energy", { precision: 8, scale: 2 }),
  mbrPhTemp: decimal("mbr_ph_temp", { precision: 8, scale: 2 }),
  h2so4Temp: decimal("h2so4_temp", { precision: 8, scale: 2 }),
  
  // Boolean status fields
  h2so4Rf: boolean("h2so4_rf"),
  mbr1pumpRf: boolean("mbr1pump_rf"),
  mbr2pumpRf: boolean("mbr2pump_rf"),
  mbrRf: boolean("mbr_rf"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_mbr_site_timestamp").on(table.siteId, table.timestamp),
]);

// Real-time RO Data Table (similar to sona1_reject_ro from Python code)
export const roRealtimeData = pgTable("ro_realtime_data", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // RO Parameters
  feedFlow: decimal("feed_flow", { precision: 8, scale: 2 }),
  roRecovery: decimal("ro_recovery", { precision: 8, scale: 2 }),
  roFeedPh: decimal("ro_feed_ph", { precision: 8, scale: 2 }),
  roFeedLt: decimal("ro_feed_lt", { precision: 8, scale: 2 }),
  
  // Stage 1 Parameters
  stg1Per: decimal("stg1_per", { precision: 8, scale: 2 }),
  stg1Recovery: decimal("stg1_recovery", { precision: 8, scale: 2 }),
  stg1InPt: decimal("stg1_in_pt", { precision: 8, scale: 2 }),
  stg1OutPt: decimal("stg1_out_pt", { precision: 8, scale: 2 }),
  stg1Dp: decimal("stg1_dp", { precision: 8, scale: 2 }),
  
  // Stage 2 Parameters
  stg2Per: decimal("stg2_per", { precision: 8, scale: 2 }),
  stg2Recovery: decimal("stg2_recovery", { precision: 8, scale: 2 }),
  stg2InPt: decimal("stg2_in_pt", { precision: 8, scale: 2 }),
  stg2OutPt: decimal("stg2_out_pt", { precision: 8, scale: 2 }),
  stg2Dp: decimal("stg2_dp", { precision: 8, scale: 2 }),
  
  // CAT Filter Parameters
  roCatInPt: decimal("ro_cat_in_pt", { precision: 8, scale: 2 }),
  roCatOutPt: decimal("ro_cat_out_pt", { precision: 8, scale: 2 }),
  catDp: decimal("cat_dp", { precision: 8, scale: 2 }),
  
  // Totals
  roFeedOverall: decimal("ro_feed_overall", { precision: 8, scale: 2 }),
  stg1Overall: decimal("stg_1_overall", { precision: 8, scale: 2 }),
  stg2Overall: decimal("stg2_overall", { precision: 8, scale: 2 }),
  roFeedDay: decimal("ro_feed_day", { precision: 8, scale: 2 }),
  stg1Day: decimal("stg_1_day", { precision: 8, scale: 2 }),
  stg2Day: decimal("stg_2_day", { precision: 8, scale: 2 }),
  
  // CIP Parameters
  roCipFlow: decimal("ro_cip_flow", { precision: 8, scale: 2 }),
  roCipPt: decimal("ro_cip_pt", { precision: 8, scale: 2 }),
  roCipStg1Dp: decimal("ro_cip_stg1_dp", { precision: 8, scale: 2 }),
  roCipStg2Dp: decimal("ro_cip_stg2_dp", { precision: 8, scale: 2 }),
  roRawWaterFlow: decimal("ro_raw_water_flow", { precision: 8, scale: 2 }),
  
  // Frequency data
  hpp1Hz: decimal("hpp1_hz", { precision: 8, scale: 2 }),
  hpp2Hz: decimal("hpp2_hz", { precision: 8, scale: 2 }),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_ro_site_timestamp").on(table.siteId, table.timestamp),
]);

// Instrumentation devices management
export const instrumentation = pgTable("instrumentation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // Basic Device Information
  deviceName: varchar("device_name", { length: 255 }).notNull(),
  deviceType: varchar("device_type", { length: 100 }).notNull(), // flow_meter, ph_sensor, orp_sensor, analysis_box, valve, pressure_transmitter
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  brandName: varchar("brand_name", { length: 100 }).notNull(),
  
  // Technical Specifications
  communicationType: varchar("communication_type", { length: 50 }).notNull(), // 4-20ma, rs485, hart, modbus_tcp, modbus_rtu, profinet, ethercat
  voltage: varchar("voltage", { length: 50 }), // Operating voltage
  powerConsumption: varchar("power_consumption", { length: 50 }),
  operatingRange: varchar("operating_range", { length: 100 }),
  accuracy: varchar("accuracy", { length: 50 }),
  
  // Installation Details
  installationDate: timestamp("installation_date"),
  location: varchar("location", { length: 255 }),
  installationNotes: text("installation_notes"),
  
  // Communication Settings
  ipAddress: varchar("ip_address", { length: 45 }),
  port: integer("port"),
  slaveId: integer("slave_id"),
  baudRate: varchar("baud_rate", { length: 20 }),
  dataBits: integer("data_bits"),
  stopBits: integer("stop_bits"),
  parity: varchar("parity", { length: 10 }),
  
  // Maintenance Information
  lastCalibration: timestamp("last_calibration"),
  nextCalibration: timestamp("next_calibration"),
  calibrationInterval: integer("calibration_interval"), // in days
  maintenanceNotes: text("maintenance_notes"),
  
  // Status and Condition
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, maintenance, faulty
  operationalStatus: varchar("operational_status", { length: 20 }).default("normal"), // normal, warning, alarm, fault
  
  // Documentation
  deviceImage: varchar("device_image", { length: 500 }), // URL or path to device image
  manualPath: varchar("manual_path", { length: 500 }), // Path to device manual/documentation
  certificatePath: varchar("certificate_path", { length: 500 }), // Calibration certificates
  
  // Additional Information
  manufacturer: varchar("manufacturer", { length: 100 }),
  partNumber: varchar("part_number", { length: 100 }),
  firmwareVersion: varchar("firmware_version", { length: 50 }),
  comments: text("comments"),
  tags: varchar("tags", { length: 500 }), // Comma-separated tags for categorization
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_instrumentation_site").on(table.siteId),
  index("idx_instrumentation_type").on(table.deviceType),
  index("idx_instrumentation_status").on(table.status),
  index("idx_instrumentation_communication").on(table.communicationType),
]);

// PLC I/O Points table for Beckhoff systems
export const plcIoPoints = pgTable("plc_io_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // Point Identification
  pointName: varchar("point_name", { length: 100 }).notNull(),
  pointDescription: text("point_description"),
  pointType: varchar("point_type", { length: 20 }).notNull(), // digital_input, digital_output, analog_input, analog_output
  
  // Physical Configuration
  moduleAddress: varchar("module_address", { length: 50 }), // e.g., "1001", "1002"
  channelNumber: integer("channel_number"), // Channel on the I/O module
  physicalAddress: varchar("physical_address", { length: 100 }), // Full Beckhoff address
  
  // Signal Properties
  signalType: varchar("signal_type", { length: 30 }), // 4-20mA, 0-10V, 24VDC, PT100, etc.
  engineeringUnit: varchar("engineering_unit", { length: 20 }), // °C, bar, L/min, etc.
  dataType: varchar("data_type", { length: 20 }).default("REAL"), // BOOL, INT, REAL, DINT
  
  // Scaling and Conversion
  rawMin: decimal("raw_min", { precision: 10, scale: 3 }), // Raw signal minimum (e.g., 0)
  rawMax: decimal("raw_max", { precision: 10, scale: 3 }), // Raw signal maximum (e.g., 32767)
  engineeredMin: decimal("engineered_min", { precision: 10, scale: 3 }), // Engineering minimum (e.g., 0)
  engineeredMax: decimal("engineered_max", { precision: 10, scale: 3 }), // Engineering maximum (e.g., 100)
  
  // Status and Configuration
  isEnabled: boolean("is_enabled").default(true),
  alarmHigh: decimal("alarm_high", { precision: 10, scale: 3 }),
  alarmLow: decimal("alarm_low", { precision: 10, scale: 3 }),
  warningHigh: decimal("warning_high", { precision: 10, scale: 3 }),
  warningLow: decimal("warning_low", { precision: 10, scale: 3 }),
  
  // Documentation
  comments: text("comments"),
  tags: varchar("tags", { length: 300 }), // Comma-separated tags
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_plc_io_points_site").on(table.siteId),
  index("idx_plc_io_points_type").on(table.pointType),
  index("idx_plc_io_points_module").on(table.moduleAddress),
]);

// PLC I/O Calculations table for complex calculations
export const plcIoCalculations = pgTable("plc_io_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // Calculation Definition
  calculationName: varchar("calculation_name", { length: 100 }).notNull(),
  calculationDescription: text("calculation_description"),
  calculationType: varchar("calculation_type", { length: 30 }).notNull(), // scaling, flow_compensation, temperature_correction, etc.
  
  // Input Parameters
  inputPoints: jsonb("input_points"), // Array of input point IDs and their roles
  formula: text("formula"), // Mathematical formula or expression
  constants: jsonb("constants"), // Named constants used in calculation
  
  // Output Configuration
  outputVariable: varchar("output_variable", { length: 100 }), // PLC variable name for result
  outputUnit: varchar("output_unit", { length: 20 }),
  outputDataType: varchar("output_data_type", { length: 20 }).default("REAL"),
  
  // Execution Settings
  executionInterval: integer("execution_interval").default(1000), // milliseconds
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(5), // 1-10, higher number = higher priority
  
  // Validation and Limits
  resultMin: decimal("result_min", { precision: 12, scale: 4 }),
  resultMax: decimal("result_max", { precision: 12, scale: 4 }),
  validationRules: jsonb("validation_rules"),
  
  // Documentation
  exampleCalculation: text("example_calculation"),
  notes: text("notes"),
  version: varchar("version", { length: 10 }).default("1.0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_plc_calculations_site").on(table.siteId),
  index("idx_plc_calculations_type").on(table.calculationType),
  index("idx_plc_calculations_active").on(table.isActive),
]);

// PLC I/O Mappings for logical-to-physical address mapping
export const plcIoMappings = pgTable("plc_io_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  pointId: varchar("point_id").references(() => plcIoPoints.id, { onDelete: "cascade" }),
  
  // Logical Address Information
  logicalAddress: varchar("logical_address", { length: 100 }).notNull(), // e.g., "%IW100", "%QX0.1"
  variableName: varchar("variable_name", { length: 100 }), // PLC variable name
  symbolName: varchar("symbol_name", { length: 100 }), // Symbolic name in TwinCAT
  
  // Hardware Configuration
  deviceType: varchar("device_type", { length: 50 }), // EK1100, EL2004, EL3004, etc.
  terminalPosition: integer("terminal_position"), // Position in EtherCAT network
  
  // Network Configuration
  etherCatAddress: varchar("ethercat_address", { length: 20 }), // EtherCAT slave address
  coupler: varchar("coupler", { length: 50 }), // Coupler device name
  
  // Status
  isConfigured: boolean("is_configured").default(false),
  isVerified: boolean("is_verified").default(false),
  lastVerification: timestamp("last_verification"),
  
  // Documentation
  configNotes: text("config_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_plc_mappings_site").on(table.siteId),
  index("idx_plc_mappings_point").on(table.pointId),
  index("idx_plc_mappings_logical").on(table.logicalAddress),
  index("idx_plc_mappings_ethercat").on(table.etherCatAddress),
]);

// Insert schemas for the new tables
export const insertMbrRealtimeDataSchema = createInsertSchema(mbrRealtimeData).omit({
  id: true,
  timestamp: true,
});

export const insertRoRealtimeDataSchema = createInsertSchema(roRealtimeData).omit({
  id: true,
  timestamp: true,
});

export const insertInstrumentationSchema = createInsertSchema(instrumentation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlcIoPointSchema = createInsertSchema(plcIoPoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlcIoCalculationSchema = createInsertSchema(plcIoCalculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlcIoMappingSchema = createInsertSchema(plcIoMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for automation wizard tables
export const insertAutomationProjectSchema = createInsertSchema(automationProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for vendor and product tables
export const insertAutomationVendorSchema = createInsertSchema(automationVendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationProductSchema = createInsertSchema(automationProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBeckhoffProductSchema = createInsertSchema(beckhoffProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationPanelSchema = createInsertSchema(automationPanels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationModuleSchema = createInsertSchema(communicationModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationDeviceTemplateSchema = createInsertSchema(automationDeviceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for the new tables
export type MbrRealtimeData = typeof mbrRealtimeData.$inferSelect;
export type InsertMbrRealtimeData = z.infer<typeof insertMbrRealtimeDataSchema>;
export type RoRealtimeData = typeof roRealtimeData.$inferSelect;
export type InsertRoRealtimeData = z.infer<typeof insertRoRealtimeDataSchema>;
export type Instrumentation = typeof instrumentation.$inferSelect;
export type InsertInstrumentation = z.infer<typeof insertInstrumentationSchema>;

// Automation wizard types
export type AutomationProject = typeof automationProjects.$inferSelect;
export type InsertAutomationProject = z.infer<typeof insertAutomationProjectSchema>;
// Export types for vendor and product tables
export type AutomationVendor = typeof automationVendors.$inferSelect;
export type InsertAutomationVendor = z.infer<typeof insertAutomationVendorSchema>;

export type AutomationProduct = typeof automationProducts.$inferSelect;
export type InsertAutomationProduct = z.infer<typeof insertAutomationProductSchema>;

export type BeckhoffProduct = typeof beckhoffProducts.$inferSelect;
export type InsertBeckhoffProduct = z.infer<typeof insertBeckhoffProductSchema>;
export type AutomationPanel = typeof automationPanels.$inferSelect;
export type InsertAutomationPanel = z.infer<typeof insertAutomationPanelSchema>;
export type CommunicationModule = typeof communicationModules.$inferSelect;
export type InsertCommunicationModule = z.infer<typeof insertCommunicationModuleSchema>;
export type AutomationDeviceTemplate = typeof automationDeviceTemplates.$inferSelect;
export type InsertAutomationDeviceTemplate = z.infer<typeof insertAutomationDeviceTemplateSchema>;

// PLC I/O Types
export type PlcIoPoint = typeof plcIoPoints.$inferSelect;
export type InsertPlcIoPoint = z.infer<typeof insertPlcIoPointSchema>;
export type PlcIoCalculation = typeof plcIoCalculations.$inferSelect;
export type InsertPlcIoCalculation = z.infer<typeof insertPlcIoCalculationSchema>;
export type PlcIoMapping = typeof plcIoMappings.$inferSelect;
export type InsertPlcIoMapping = z.infer<typeof insertPlcIoMappingSchema>;

// Site Event Database Configuration Schema
export const insertSiteEventConfigSchema = z.object({
  siteId: z.string().optional(),
  siteName: z.string().min(1, "Site name is required"),
  databaseName: z.string().min(1, "Database name is required"),
  tableName: z.string().min(1, "Table name is required"),
});

export type SiteEventConfig = z.infer<typeof insertSiteEventConfigSchema>;

// Panel Configuration System for Beckhoff Equipment
export const panelConfigurations = pgTable("panel_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  
  // Panel Information
  panelName: varchar("panel_name", { length: 100 }).notNull(),
  panelDescription: text("panel_description"),
  panelLocation: varchar("panel_location", { length: 255 }),
  panelType: varchar("panel_type", { length: 50 }).default("control"), // control, distribution, motor_starter
  
  // Physical Configuration
  cabinetSize: varchar("cabinet_size", { length: 50 }), // 400x600, 600x800, etc.
  mountingType: varchar("mounting_type", { length: 30 }).default("wall"), // wall, floor, pole
  enclosureRating: varchar("enclosure_rating", { length: 20 }).default("IP54"), // IP54, IP65, etc.
  
  // Beckhoff Configuration
  couplerType: varchar("coupler_type", { length: 50 }).notNull(), // EK1100, EK1122, EK1501, etc.
  powerSupply: varchar("power_supply", { length: 50 }).default("EL9011"), // EL9011, EL9012, etc.
  distanceFromPlc: integer("distance_from_plc"), // meters
  
  // Status and Planning
  isActive: boolean("is_active").default(true),
  installationStatus: varchar("installation_status", { length: 30 }).default("planned"), // planned, in_progress, completed
  
  // Cost and Planning
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_panels_site").on(table.siteId),
  index("idx_panels_coupler").on(table.couplerType),
  index("idx_panels_distance").on(table.distanceFromPlc),
]);

// Instrument Configuration Templates
export const instrumentTemplates = pgTable("instrument_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template Information
  templateName: varchar("template_name", { length: 100 }).notNull(),
  instrumentType: varchar("instrument_type", { length: 50 }).notNull(), // motor, valve, sensor, pump, etc.
  category: varchar("category", { length: 30 }).notNull(), // drive, protection, control
  
  // I/O Requirements
  digitalInputs: integer("digital_inputs").default(0), // Number of DI required
  digitalOutputs: integer("digital_outputs").default(0), // Number of DO required
  analogInputs: integer("analog_inputs").default(0), // Number of AI required
  analogOutputs: integer("analog_outputs").default(0), // Number of AO required
  
  // Specific Signal Types
  signalTypes: jsonb("signal_types"), // {"DI": ["run_feedback", "trip", "ready"], "DO": ["start", "stop"]}
  voltageLevel: varchar("voltage_level", { length: 20 }).default("24VDC"), // 24VDC, 230VAC, etc.
  
  // Beckhoff Module Recommendations
  recommendedModules: jsonb("recommended_modules"), // Suggested Beckhoff modules
  moduleCount: jsonb("module_count"), // How many of each module type
  
  // Tag Naming Convention
  tagPrefix: varchar("tag_prefix", { length: 20 }), // MOT_, VLV_, PMP_, etc.
  tagStructure: text("tag_structure"), // Template for tag generation
  
  // Documentation
  description: text("description"),
  notes: text("notes"),
  isStandard: boolean("is_standard").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_templates_type").on(table.instrumentType),
  index("idx_templates_category").on(table.category),
]);

// Panel Instruments - Links panels to their instruments
export const panelInstruments = pgTable("panel_instruments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  panelId: varchar("panel_id").notNull().references(() => panelConfigurations.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => instrumentTemplates.id),
  
  // Instrument Details
  instrumentName: varchar("instrument_name", { length: 100 }).notNull(),
  instrumentTag: varchar("instrument_tag", { length: 50 }).notNull().unique(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  
  // Configuration Override
  customIoRequirements: jsonb("custom_io_requirements"), // Override template if needed
  specificModules: jsonb("specific_modules"), // Specific module selections
  
  // Operational Details
  isEmergencyStop: boolean("is_emergency_stop").default(false),
  isSafetyRelated: boolean("is_safety_related").default(false),
  operatingVoltage: varchar("operating_voltage", { length: 20 }).default("24VDC"),
  
  // Status
  installationStatus: varchar("installation_status", { length: 30 }).default("planned"),
  commissioningStatus: varchar("commissioning_status", { length: 30 }).default("pending"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_panel_instruments_panel").on(table.panelId),
  index("idx_panel_instruments_template").on(table.templateId),
  index("idx_panel_instruments_tag").on(table.instrumentTag),
]);

// Beckhoff Module Calculations
export const beckhoffModuleCalculations = pgTable("beckhoff_module_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  panelId: varchar("panel_id").notNull().references(() => panelConfigurations.id, { onDelete: "cascade" }),
  
  // Calculation Summary
  calculationName: varchar("calculation_name", { length: 100 }).notNull(),
  totalDigitalInputs: integer("total_digital_inputs").default(0),
  totalDigitalOutputs: integer("total_digital_outputs").default(0),
  totalAnalogInputs: integer("total_analog_inputs").default(0),
  totalAnalogOutputs: integer("total_analog_outputs").default(0),
  
  // Module Requirements
  requiredModules: jsonb("required_modules"), // Calculated module list with quantities
  couplerSelection: varchar("coupler_selection", { length: 50 }), // Selected based on distance/requirements
  powerModules: jsonb("power_modules"), // Power supply modules needed
  
  // Cost Calculation
  totalModuleCost: decimal("total_module_cost", { precision: 10, scale: 2 }),
  installationCost: decimal("installation_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  
  // Technical Details
  maxDistance: integer("max_distance"), // Maximum cable distance supported
  powerConsumption: decimal("power_consumption", { precision: 8, scale: 2 }), // Watts
  networkLoad: decimal("network_load", { precision: 5, scale: 2 }), // Percentage
  
  // Generated Documentation
  moduleList: text("module_list"), // Formatted module list
  wiringDiagram: text("wiring_diagram"), // ASCII or text-based wiring info
  tagList: text("tag_list"), // Generated tag names
  
  // Status
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_module_calc_panel").on(table.panelId),
  index("idx_module_calc_approved").on(table.isApproved),
]);

// Insert schemas for new tables
export const insertPanelConfigurationSchema = createInsertSchema(panelConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstrumentTemplateSchema = createInsertSchema(instrumentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPanelInstrumentSchema = createInsertSchema(panelInstruments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBeckhoffModuleCalculationSchema = createInsertSchema(beckhoffModuleCalculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types for new tables
export type PanelConfiguration = typeof panelConfigurations.$inferSelect;
export type InsertPanelConfiguration = z.infer<typeof insertPanelConfigurationSchema>;

export type InstrumentTemplate = typeof instrumentTemplates.$inferSelect;
export type InsertInstrumentTemplate = z.infer<typeof insertInstrumentTemplateSchema>;

export type PanelInstrument = typeof panelInstruments.$inferSelect;
export type InsertPanelInstrument = z.infer<typeof insertPanelInstrumentSchema>;

export type BeckhoffModuleCalculation = typeof beckhoffModuleCalculations.$inferSelect;
export type InsertBeckhoffModuleCalculation = z.infer<typeof insertBeckhoffModuleCalculationSchema>;

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

// Types for the new tables
export type MbrRealtimeData = typeof mbrRealtimeData.$inferSelect;
export type InsertMbrRealtimeData = z.infer<typeof insertMbrRealtimeDataSchema>;
export type RoRealtimeData = typeof roRealtimeData.$inferSelect;
export type InsertRoRealtimeData = z.infer<typeof insertRoRealtimeDataSchema>;
export type Instrumentation = typeof instrumentation.$inferSelect;
export type InsertInstrumentation = z.infer<typeof insertInstrumentationSchema>;

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

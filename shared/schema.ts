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

// Program backups (HMI and PLC)
export const programBackups = pgTable("program_backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(), // hmi, plc
  version: varchar("version", { length: 50 }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"), // in bytes
  checksum: varchar("checksum", { length: 64 }),
  platform: varchar("platform", { length: 50 }).default("twincat"), // twincat, other
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_backups_site").on(table.siteId),
  index("idx_backups_type").on(table.type),
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



export const insertIpcManagementSchema = createInsertSchema(ipcManagement).omit({
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

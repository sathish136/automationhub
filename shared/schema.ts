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

// Network equipment
export const networkEquipment = pgTable("network_equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // router, modem, switch, firewall
  model: varchar("model", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  macAddress: varchar("mac_address", { length: 17 }),
  status: varchar("status", { length: 20 }).notNull().default("unknown"),
  lastCheck: timestamp("last_check"),
  firmware: varchar("firmware", { length: 100 }),
  configBackup: text("config_backup"),
  credentials: text("credentials"), // encrypted
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_network_site").on(table.siteId),
  index("idx_network_type").on(table.type),
  index("idx_network_ip").on(table.ipAddress),
]);

// IPC credentials
export const ipcCredentials = pgTable("ipc_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  password: text("password").notNull(), // encrypted
  operatingSystem: varchar("operating_system", { length: 50 }),
  remoteAccess: jsonb("remote_access"), // VNC, RDP, SSH details
  softwareInstalled: jsonb("software_installed"), // list of installed software
  notes: text("notes"),
  lastAccess: timestamp("last_access"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ipc_site").on(table.siteId),
  index("idx_ipc_ip").on(table.ipAddress),
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
  type: varchar("type", { length: 50 }).notNull(), // site_offline, high_response_time, backup_completed, equipment_failure
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

// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
  uptimeHistory: many(uptimeHistory),
  programBackups: many(programBackups),
  networkEquipment: many(networkEquipment),
  ipcCredentials: many(ipcCredentials),
  vfdParameters: many(vfdParameters),
  alerts: many(alerts),
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

export const networkEquipmentRelations = relations(networkEquipment, ({ one }) => ({
  site: one(sites, {
    fields: [networkEquipment.siteId],
    references: [sites.id],
  }),
}));

export const ipcCredentialsRelations = relations(ipcCredentials, ({ one }) => ({
  site: one(sites, {
    fields: [ipcCredentials.siteId],
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

// Insert schemas
export const insertSiteSchema = createInsertSchema(sites).omit({
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

export const insertNetworkEquipmentSchema = createInsertSchema(networkEquipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIpcCredentialSchema = createInsertSchema(ipcCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Types
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type UptimeHistory = typeof uptimeHistory.$inferSelect;
export type InsertUptimeHistory = z.infer<typeof insertUptimeHistorySchema>;
export type ProgramBackup = typeof programBackups.$inferSelect;
export type InsertProgramBackup = z.infer<typeof insertProgramBackupSchema>;
export type NetworkEquipment = typeof networkEquipment.$inferSelect;
export type InsertNetworkEquipment = z.infer<typeof insertNetworkEquipmentSchema>;
export type IpcCredential = typeof ipcCredentials.$inferSelect;
export type InsertIpcCredential = z.infer<typeof insertIpcCredentialSchema>;
export type VfdParameter = typeof vfdParameters.$inferSelect;
export type InsertVfdParameter = z.infer<typeof insertVfdParameterSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

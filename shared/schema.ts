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

// Communication interfaces and protocols
export const communicationInterfaces = pgTable("communication_interfaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // rs485, 4-20ma, modbus_tcp, modbus_rtu, profinet
  connectionType: varchar("connection_type", { length: 50 }), // serial, ethernet, fieldbus
  ipAddress: varchar("ip_address", { length: 45 }),
  port: integer("port"),
  baudRate: integer("baud_rate"),
  parity: varchar("parity", { length: 10 }), // none, odd, even
  stopBits: integer("stop_bits"),
  dataBits: integer("data_bits"),
  slaveId: integer("slave_id"), // For Modbus devices
  deviceAddress: varchar("device_address", { length: 100 }),
  protocol: varchar("protocol", { length: 50 }), // modbus, profinet, hart, etc.
  status: varchar("status", { length: 20 }).notNull().default("unknown"), // online, offline, error, unknown
  lastCheck: timestamp("last_check"),
  lastSuccessfulComm: timestamp("last_successful_comm"),
  errorCount: integer("error_count").default(0),
  configuration: jsonb("configuration"), // protocol-specific config
  dataPoints: jsonb("data_points"), // mapped data points
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_comm_site").on(table.siteId),
  index("idx_comm_type").on(table.type),
  index("idx_comm_status").on(table.status),
]);

// Instrument data (for 4-20mA, analog signals, etc.)
export const instrumentData = pgTable("instrument_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commInterfaceId: varchar("comm_interface_id").notNull().references(() => communicationInterfaces.id, { onDelete: "cascade" }),
  tagName: varchar("tag_name", { length: 255 }).notNull(),
  description: text("description"),
  dataType: varchar("data_type", { length: 50 }).notNull(), // analog, digital, temperature, pressure, flow, level
  unit: varchar("unit", { length: 20 }), // mA, V, °C, bar, l/min, etc.
  minValue: decimal("min_value", { precision: 10, scale: 3 }),
  maxValue: decimal("max_value", { precision: 10, scale: 3 }),
  currentValue: decimal("current_value", { precision: 10, scale: 3 }),
  lastReading: timestamp("last_reading"),
  quality: varchar("quality", { length: 20 }).default("good"), // good, bad, uncertain
  alarmLow: decimal("alarm_low", { precision: 10, scale: 3 }),
  alarmHigh: decimal("alarm_high", { precision: 10, scale: 3 }),
  warningLow: decimal("warning_low", { precision: 10, scale: 3 }),
  warningHigh: decimal("warning_high", { precision: 10, scale: 3 }),
  scalingConfig: jsonb("scaling_config"), // raw to engineering units conversion
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_instrument_comm").on(table.commInterfaceId),
  index("idx_instrument_tag").on(table.tagName),
  index("idx_instrument_type").on(table.dataType),
]);

// Communication logs for troubleshooting
export const communicationLogs = pgTable("communication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commInterfaceId: varchar("comm_interface_id").notNull().references(() => communicationInterfaces.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  logType: varchar("log_type", { length: 50 }).notNull(), // request, response, error, status_change
  message: text("message"),
  rawData: text("raw_data"), // hex or raw communication data
  errorCode: varchar("error_code", { length: 50 }),
  responseTime: integer("response_time"), // in milliseconds
  success: boolean("success").notNull(),
}, (table) => [
  index("idx_comm_logs_interface").on(table.commInterfaceId),
  index("idx_comm_logs_timestamp").on(table.timestamp),
  index("idx_comm_logs_type").on(table.logType),
]);

// Alerts and notifications
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").references(() => sites.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // site_offline, high_response_time, backup_completed, equipment_failure, communication_error
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
  communicationInterfaces: many(communicationInterfaces),
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

export const communicationInterfacesRelations = relations(communicationInterfaces, ({ one, many }) => ({
  site: one(sites, {
    fields: [communicationInterfaces.siteId],
    references: [sites.id],
  }),
  instrumentData: many(instrumentData),
  communicationLogs: many(communicationLogs),
}));

export const instrumentDataRelations = relations(instrumentData, ({ one }) => ({
  communicationInterface: one(communicationInterfaces, {
    fields: [instrumentData.commInterfaceId],
    references: [communicationInterfaces.id],
  }),
}));

export const communicationLogsRelations = relations(communicationLogs, ({ one }) => ({
  communicationInterface: one(communicationInterfaces, {
    fields: [communicationLogs.commInterfaceId],
    references: [communicationInterfaces.id],
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

export const insertCommunicationInterfaceSchema = createInsertSchema(communicationInterfaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstrumentDataSchema = createInsertSchema(instrumentData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  timestamp: true,
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
export type CommunicationInterface = typeof communicationInterfaces.$inferSelect;
export type InsertCommunicationInterface = z.infer<typeof insertCommunicationInterfaceSchema>;
export type InstrumentData = typeof instrumentData.$inferSelect;
export type InsertInstrumentData = z.infer<typeof insertInstrumentDataSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

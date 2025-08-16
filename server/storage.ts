import {
  sites,
  uptimeHistory,
  programBackups,
  networkEquipment,
  ipcCredentials,
  vfdParameters,
  alerts,
  type Site,
  type InsertSite,
  type UptimeHistory,
  type InsertUptimeHistory,
  type ProgramBackup,
  type InsertProgramBackup,
  type NetworkEquipment,
  type InsertNetworkEquipment,
  type IpcCredential,
  type InsertIpcCredential,
  type VfdParameter,
  type InsertVfdParameter,
  type Alert,
  type InsertAlert,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Sites
  getAllSites(): Promise<Site[]>;
  getSite(id: string): Promise<Site | undefined>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: string, site: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: string): Promise<boolean>;
  updateSiteStatus(id: string, status: string, responseTime?: number): Promise<void>;

  // Uptime History
  getUptimeHistory(siteId: string, limit?: number): Promise<UptimeHistory[]>;
  addUptimeRecord(record: InsertUptimeHistory): Promise<UptimeHistory>;
  getUptimeStats(siteId: string, hours: number): Promise<{ uptime: number; avgResponseTime: number }>;

  // Program Backups
  getProgramBackups(siteId?: string): Promise<ProgramBackup[]>;
  createProgramBackup(backup: InsertProgramBackup): Promise<ProgramBackup>;
  deleteProgramBackup(id: string): Promise<boolean>;

  // Network Equipment
  getNetworkEquipment(siteId?: string): Promise<NetworkEquipment[]>;
  createNetworkEquipment(equipment: InsertNetworkEquipment): Promise<NetworkEquipment>;
  updateNetworkEquipment(id: string, equipment: Partial<InsertNetworkEquipment>): Promise<NetworkEquipment | undefined>;
  deleteNetworkEquipment(id: string): Promise<boolean>;

  // IPC Credentials
  getIpcCredentials(siteId?: string): Promise<IpcCredential[]>;
  createIpcCredential(credential: InsertIpcCredential): Promise<IpcCredential>;
  updateIpcCredential(id: string, credential: Partial<InsertIpcCredential>): Promise<IpcCredential | undefined>;
  deleteIpcCredential(id: string): Promise<boolean>;

  // VFD Parameters
  getVfdParameters(siteId?: string): Promise<VfdParameter[]>;
  createVfdParameter(parameter: InsertVfdParameter): Promise<VfdParameter>;
  updateVfdParameter(id: string, parameter: Partial<InsertVfdParameter>): Promise<VfdParameter | undefined>;
  deleteVfdParameter(id: string): Promise<boolean>;

  // Alerts
  getAlerts(limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<void>;
  markAlertAsResolved(id: string): Promise<void>;
  getUnreadAlertsCount(): Promise<number>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalSites: number;
    onlineSites: number;
    criticalAlerts: number;
    avgResponseTime: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Sites
  async getAllSites(): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.isActive, true));
  }

  async getSite(id: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site;
  }

  async createSite(site: InsertSite): Promise<Site> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }

  async updateSite(id: string, site: Partial<InsertSite>): Promise<Site | undefined> {
    const [updatedSite] = await db
      .update(sites)
      .set({ ...site, updatedAt: new Date() })
      .where(eq(sites.id, id))
      .returning();
    return updatedSite;
  }

  async deleteSite(id: string): Promise<boolean> {
    const result = await db
      .update(sites)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(sites.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateSiteStatus(id: string, status: string, responseTime?: number): Promise<void> {
    const updateData: any = { 
      status, 
      lastCheck: new Date(),
      updatedAt: new Date()
    };
    
    if (responseTime !== undefined) {
      updateData.responseTime = responseTime;
    }
    
    if (status === "online") {
      updateData.lastOnline = new Date();
    }

    await db.update(sites).set(updateData).where(eq(sites.id, id));
  }

  // Uptime History
  async getUptimeHistory(siteId: string, limit = 100): Promise<UptimeHistory[]> {
    return await db
      .select()
      .from(uptimeHistory)
      .where(eq(uptimeHistory.siteId, siteId))
      .orderBy(desc(uptimeHistory.timestamp))
      .limit(limit);
  }

  async addUptimeRecord(record: InsertUptimeHistory): Promise<UptimeHistory> {
    const [newRecord] = await db.insert(uptimeHistory).values(record).returning();
    return newRecord;
  }

  async getUptimeStats(siteId: string, hours: number): Promise<{ uptime: number; avgResponseTime: number }> {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const result = await db
      .select({
        totalRecords: count(),
        onlineRecords: sql<number>`sum(case when ${uptimeHistory.isOnline} then 1 else 0 end)`,
        avgResponseTime: sql<number>`avg(${uptimeHistory.responseTime})`,
      })
      .from(uptimeHistory)
      .where(
        and(
          eq(uptimeHistory.siteId, siteId),
          gte(uptimeHistory.timestamp, hoursAgo)
        )
      );

    const stats = result[0];
    const uptime = stats.totalRecords > 0 ? (stats.onlineRecords / stats.totalRecords) * 100 : 0;
    const avgResponseTime = stats.avgResponseTime || 0;

    return { uptime, avgResponseTime };
  }

  // Program Backups
  async getProgramBackups(siteId?: string): Promise<ProgramBackup[]> {
    const query = db.select().from(programBackups);
    if (siteId) {
      return await query.where(eq(programBackups.siteId, siteId));
    }
    return await query;
  }

  async createProgramBackup(backup: InsertProgramBackup): Promise<ProgramBackup> {
    const [newBackup] = await db.insert(programBackups).values(backup).returning();
    return newBackup;
  }

  async deleteProgramBackup(id: string): Promise<boolean> {
    const result = await db.delete(programBackups).where(eq(programBackups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Network Equipment
  async getNetworkEquipment(siteId?: string): Promise<NetworkEquipment[]> {
    const query = db.select().from(networkEquipment);
    if (siteId) {
      return await query.where(eq(networkEquipment.siteId, siteId));
    }
    return await query;
  }

  async createNetworkEquipment(equipment: InsertNetworkEquipment): Promise<NetworkEquipment> {
    const [newEquipment] = await db.insert(networkEquipment).values(equipment).returning();
    return newEquipment;
  }

  async updateNetworkEquipment(id: string, equipment: Partial<InsertNetworkEquipment>): Promise<NetworkEquipment | undefined> {
    const [updatedEquipment] = await db
      .update(networkEquipment)
      .set({ ...equipment, updatedAt: new Date() })
      .where(eq(networkEquipment.id, id))
      .returning();
    return updatedEquipment;
  }

  async deleteNetworkEquipment(id: string): Promise<boolean> {
    const result = await db.delete(networkEquipment).where(eq(networkEquipment.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // IPC Credentials
  async getIpcCredentials(siteId?: string): Promise<IpcCredential[]> {
    const query = db.select().from(ipcCredentials);
    if (siteId) {
      return await query.where(eq(ipcCredentials.siteId, siteId));
    }
    return await query;
  }

  async createIpcCredential(credential: InsertIpcCredential): Promise<IpcCredential> {
    // Encrypt password before storing
    const hashedPassword = await bcrypt.hash(credential.password, 10);
    const credentialWithEncryptedPassword = {
      ...credential,
      password: hashedPassword,
    };
    
    const [newCredential] = await db
      .insert(ipcCredentials)
      .values(credentialWithEncryptedPassword)
      .returning();
    return newCredential;
  }

  async updateIpcCredential(id: string, credential: Partial<InsertIpcCredential>): Promise<IpcCredential | undefined> {
    const updateData = { ...credential, updatedAt: new Date() };
    
    // Encrypt password if provided
    if (credential.password) {
      updateData.password = await bcrypt.hash(credential.password, 10);
    }

    const [updatedCredential] = await db
      .update(ipcCredentials)
      .set(updateData)
      .where(eq(ipcCredentials.id, id))
      .returning();
    return updatedCredential;
  }

  async deleteIpcCredential(id: string): Promise<boolean> {
    const result = await db.delete(ipcCredentials).where(eq(ipcCredentials.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // VFD Parameters
  async getVfdParameters(siteId?: string): Promise<VfdParameter[]> {
    const query = db.select().from(vfdParameters).where(eq(vfdParameters.isActive, true));
    if (siteId) {
      return await query.where(eq(vfdParameters.siteId, siteId));
    }
    return await query;
  }

  async createVfdParameter(parameter: InsertVfdParameter): Promise<VfdParameter> {
    const [newParameter] = await db.insert(vfdParameters).values(parameter).returning();
    return newParameter;
  }

  async updateVfdParameter(id: string, parameter: Partial<InsertVfdParameter>): Promise<VfdParameter | undefined> {
    const [updatedParameter] = await db
      .update(vfdParameters)
      .set({ ...parameter, updatedAt: new Date() })
      .where(eq(vfdParameters.id, id))
      .returning();
    return updatedParameter;
  }

  async deleteVfdParameter(id: string): Promise<boolean> {
    const result = await db
      .update(vfdParameters)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(vfdParameters.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Alerts
  async getAlerts(limit = 50): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async markAlertAsRead(id: string): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  }

  async markAlertAsResolved(id: string): Promise<void> {
    await db
      .update(alerts)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(eq(alerts.id, id));
  }

  async getUnreadAlertsCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(alerts)
      .where(eq(alerts.isRead, false));
    return result[0]?.count || 0;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalSites: number;
    onlineSites: number;
    criticalAlerts: number;
    avgResponseTime: number;
  }> {
    const [siteStats] = await db
      .select({
        totalSites: count(),
        onlineSites: sql<number>`sum(case when ${sites.status} = 'online' then 1 else 0 end)`,
        avgResponseTime: sql<number>`avg(${sites.responseTime})`,
      })
      .from(sites)
      .where(eq(sites.isActive, true));

    const [alertStats] = await db
      .select({
        criticalAlerts: count(),
      })
      .from(alerts)
      .where(
        and(
          eq(alerts.severity, "critical"),
          eq(alerts.isResolved, false)
        )
      );

    return {
      totalSites: siteStats.totalSites || 0,
      onlineSites: siteStats.onlineSites || 0,
      criticalAlerts: alertStats.criticalAlerts || 0,
      avgResponseTime: Math.round(siteStats.avgResponseTime || 0),
    };
  }
}

export const storage = new DatabaseStorage();

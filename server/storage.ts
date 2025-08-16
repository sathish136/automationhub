import {
  sites,
  uptimeHistory,
  programBackups,
  networkEquipment,
  ipcManagement,
  vfdParameters,
  communicationInterfaces,
  instrumentData,
  communicationLogs,
  alerts,
  projects,
  type Site,
  type InsertSite,
  type UptimeHistory,
  type InsertUptimeHistory,
  type ProgramBackup,
  type InsertProgramBackup,
  type NetworkEquipment,
  type InsertNetworkEquipment,
  type IpcManagement,
  type InsertIpcManagement,
  type VfdParameter,
  type InsertVfdParameter,
  type CommunicationInterface,
  type InsertCommunicationInterface,
  type InstrumentData,
  type InsertInstrumentData,
  type CommunicationLog,
  type InsertCommunicationLog,
  type Alert,
  type InsertAlert,
  type Project,
  type InsertProject,
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
  getIpcManagement(siteId?: string): Promise<IpcManagement[]>;
  createIpcManagement(device: InsertIpcManagement): Promise<IpcManagement>;
  updateIpcManagement(id: string, device: Partial<InsertIpcManagement>): Promise<IpcManagement | undefined>;
  deleteIpcManagement(id: string): Promise<boolean>;

  // VFD Parameters
  getVfdParameters(siteId?: string): Promise<VfdParameter[]>;
  createVfdParameter(parameter: InsertVfdParameter): Promise<VfdParameter>;
  updateVfdParameter(id: string, parameter: Partial<InsertVfdParameter>): Promise<VfdParameter | undefined>;
  deleteVfdParameter(id: string): Promise<boolean>;

  // Communication interfaces
  getCommunicationInterfaces(siteId?: string): Promise<CommunicationInterface[]>;
  createCommunicationInterface(commInterface: InsertCommunicationInterface): Promise<CommunicationInterface>;
  updateCommunicationInterface(id: string, updates: Partial<InsertCommunicationInterface>): Promise<CommunicationInterface | undefined>;
  deleteCommunicationInterface(id: string): Promise<boolean>;

  // Instrument data
  getInstrumentData(commInterfaceId: string): Promise<InstrumentData[]>;
  createInstrumentData(data: InsertInstrumentData): Promise<InstrumentData>;
  updateInstrumentData(id: string, updates: Partial<InsertInstrumentData>): Promise<InstrumentData | undefined>;
  deleteInstrumentData(id: string): Promise<boolean>;

  // Communication logs
  getCommunicationLogs(commInterfaceId: string, limit?: number): Promise<CommunicationLog[]>;
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;

  // Alerts
  getAlerts(limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<void>;
  markAlertAsResolved(id: string): Promise<void>;
  getUnreadAlertsCount(): Promise<number>;

  // Projects
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

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

  // IPC Management
  async getIpcManagement(siteId?: string): Promise<IpcManagement[]> {
    const query = db.select().from(ipcManagement);
    if (siteId) {
      return await query.where(eq(ipcManagement.siteId, siteId));
    }
    return await query;
  }

  async createIpcManagement(device: InsertIpcManagement): Promise<IpcManagement> {
    // Encrypt password before storing if provided
    let processedDevice = { ...device };
    if (device.ipcPassword) {
      const hashedPassword = await bcrypt.hash(device.ipcPassword, 10);
      processedDevice = {
        ...device,
        ipcPassword: hashedPassword,
      };
    }
    
    const [newDevice] = await db
      .insert(ipcManagement)
      .values(processedDevice)
      .returning();
    return newDevice;
  }

  async updateIpcManagement(id: string, device: Partial<InsertIpcManagement>): Promise<IpcManagement | undefined> {
    const updateData = { ...device, updatedAt: new Date() };
    
    // Encrypt password if provided
    if (device.ipcPassword) {
      updateData.ipcPassword = await bcrypt.hash(device.ipcPassword, 10);
    }

    const [updatedDevice] = await db
      .update(ipcManagement)
      .set(updateData)
      .where(eq(ipcManagement.id, id))
      .returning();
    return updatedDevice;
  }

  async deleteIpcManagement(id: string): Promise<boolean> {
    const result = await db.delete(ipcManagement).where(eq(ipcManagement.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // VFD Parameters
  async getVfdParameters(siteId?: string): Promise<VfdParameter[]> {
    if (siteId) {
      return await db
        .select()
        .from(vfdParameters)
        .where(
          and(
            eq(vfdParameters.isActive, true),
            eq(vfdParameters.siteId, siteId)
          )
        );
    }
    return await db
      .select()
      .from(vfdParameters)
      .where(eq(vfdParameters.isActive, true));
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



  // Communication Interfaces
  async getCommunicationInterfaces(siteId?: string): Promise<CommunicationInterface[]> {
    if (siteId) {
      return await db
        .select()
        .from(communicationInterfaces)
        .where(and(eq(communicationInterfaces.siteId, siteId), eq(communicationInterfaces.isActive, true)));
    }
    return await db
      .select()
      .from(communicationInterfaces)
      .where(eq(communicationInterfaces.isActive, true));
  }

  async createCommunicationInterface(commInterface: InsertCommunicationInterface): Promise<CommunicationInterface> {
    const [newInterface] = await db
      .insert(communicationInterfaces)
      .values(commInterface)
      .returning();
    return newInterface;
  }

  async updateCommunicationInterface(id: string, updates: Partial<InsertCommunicationInterface>): Promise<CommunicationInterface | undefined> {
    const [updated] = await db
      .update(communicationInterfaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communicationInterfaces.id, id))
      .returning();
    return updated;
  }

  async deleteCommunicationInterface(id: string): Promise<boolean> {
    const result = await db
      .update(communicationInterfaces)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(communicationInterfaces.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Instrument Data
  async getInstrumentData(commInterfaceId: string): Promise<InstrumentData[]> {
    return await db
      .select()
      .from(instrumentData)
      .where(and(eq(instrumentData.commInterfaceId, commInterfaceId), eq(instrumentData.isActive, true)));
  }

  async createInstrumentData(data: InsertInstrumentData): Promise<InstrumentData> {
    const [newData] = await db.insert(instrumentData).values(data).returning();
    return newData;
  }

  async updateInstrumentData(id: string, updates: Partial<InsertInstrumentData>): Promise<InstrumentData | undefined> {
    const [updated] = await db
      .update(instrumentData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(instrumentData.id, id))
      .returning();
    return updated;
  }

  async deleteInstrumentData(id: string): Promise<boolean> {
    const result = await db
      .update(instrumentData)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(instrumentData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Communication Logs
  async getCommunicationLogs(commInterfaceId: string, limit = 100): Promise<CommunicationLog[]> {
    return await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.commInterfaceId, commInterfaceId))
      .orderBy(desc(communicationLogs.timestamp))
      .limit(limit);
  }

  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    const [newLog] = await db.insert(communicationLogs).values(log).returning();
    return newLog;
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
    await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id));
  }

  async markAlertAsResolved(id: string): Promise<void> {
    await db
      .update(alerts)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(eq(alerts.id, id));
  }

  async getUnreadAlertsCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(alerts)
      .where(eq(alerts.isRead, false));
    return result.count;
  }

  // Projects
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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
        total: count(),
        online: count(sql`CASE WHEN ${sites.status} = 'online' THEN 1 END`),
        avgResponseTime: sql<number>`COALESCE(AVG(${sites.responseTime}), 0)`,
      })
      .from(sites)
      .where(eq(sites.isActive, true));

    const [alertStats] = await db
      .select({
        critical: count(sql`CASE WHEN ${alerts.severity} = 'critical' AND ${alerts.isResolved} = false THEN 1 END`),
      })
      .from(alerts);

    return {
      totalSites: siteStats.total,
      onlineSites: siteStats.online,
      criticalAlerts: alertStats.critical,
      avgResponseTime: Math.round(siteStats.avgResponseTime),
    };
  }
}

export const storage = new DatabaseStorage();

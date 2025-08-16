import {
  sites,
  uptimeHistory,
  programBackups,
  ipcManagement,
  vfdParameters,
  alerts,
  projects,
  plcTags,
  plcTagHistory,
  siteDatabaseTags,
  siteDatabaseValues,
  type Site,
  type InsertSite,
  type UptimeHistory,
  type InsertUptimeHistory,
  type ProgramBackup,
  type InsertProgramBackup,
  type IpcManagement,
  type InsertIpcManagement,
  type VfdParameter,
  type InsertVfdParameter,
  type Alert,
  type InsertAlert,
  type Project,
  type InsertProject,
  type PlcTag,
  type InsertPlcTag,
  type PlcTagHistory,
  type InsertPlcTagHistory,
  type SiteDatabaseTag,
  type InsertSiteDatabaseTag,
  type SiteDatabaseValue,
  type InsertSiteDatabaseValue,
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

  // Alerts
  getAlerts(limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<void>;
  markAlertAsResolved(id: string): Promise<void>;

  // PLC Tags
  getAllPlcTags(): Promise<PlcTag[]>;
  getPlcTagsBySite(siteId: string): Promise<PlcTag[]>;
  createPlcTag(tag: InsertPlcTag): Promise<PlcTag>;
  bulkCreatePlcTags(siteId: string, tags: Omit<InsertPlcTag, 'siteId'>[]): Promise<PlcTag[]>;
  updatePlcTag(id: string, tag: Partial<InsertPlcTag>): Promise<PlcTag | undefined>;
  deletePlcTag(id: string): Promise<boolean>;
  updatePlcTagValue(id: string, value: string): Promise<void>;
  createPlcTagAlert(tagId: string, value: string): Promise<void>;
  getUnreadAlertsCount(): Promise<number>;

  // PLC Tags
  getPlcTags(siteId?: string): Promise<PlcTag[]>;
  getActivePlcTags(siteId?: string): Promise<PlcTag[]>;
  createPlcTag(tag: InsertPlcTag): Promise<PlcTag>;
  updatePlcTag(id: string, tag: Partial<InsertPlcTag>): Promise<PlcTag | undefined>;
  deletePlcTag(id: string): Promise<boolean>;
  updatePlcTagValue(id: string, newValue: string, createHistory?: boolean): Promise<void>;
  
  // PLC Tag History
  getPlcTagHistory(tagId: string, limit?: number): Promise<PlcTagHistory[]>;
  createPlcTagHistory(history: InsertPlcTagHistory): Promise<PlcTagHistory>;

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

  // Site Database Tags
  getSiteDatabaseTags(siteId?: string): Promise<SiteDatabaseTag[]>;
  createSiteDatabaseTag(tag: InsertSiteDatabaseTag): Promise<SiteDatabaseTag>;
  updateSiteDatabaseTag(id: string, tag: Partial<InsertSiteDatabaseTag>): Promise<SiteDatabaseTag | undefined>;
  deleteSiteDatabaseTag(id: string): Promise<boolean>;

  // Site Database Values 
  getSiteDatabaseValues(tagId: string, limit?: number): Promise<SiteDatabaseValue[]>;
  createSiteDatabaseValue(value: InsertSiteDatabaseValue): Promise<SiteDatabaseValue>;
  getLatestSiteDatabaseValues(siteId: string): Promise<Array<SiteDatabaseValue & { tag: SiteDatabaseTag }>>;
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

  // PLC Tags
  async getAllPlcTags(): Promise<PlcTag[]> {
    return await db.select().from(plcTags).orderBy(desc(plcTags.createdAt));
  }

  async getPlcTagsBySite(siteId: string): Promise<PlcTag[]> {
    return await db.select().from(plcTags).where(eq(plcTags.siteId, siteId)).orderBy(desc(plcTags.createdAt));
  }

  async getPlcTags(siteId?: string): Promise<PlcTag[]> {
    if (siteId) {
      return await db.select().from(plcTags).where(eq(plcTags.siteId, siteId)).orderBy(desc(plcTags.createdAt));
    }
    return await db.select().from(plcTags).orderBy(desc(plcTags.createdAt));
  }

  async getActivePlcTags(siteId?: string): Promise<PlcTag[]> {
    if (siteId) {
      return await db.select().from(plcTags).where(and(eq(plcTags.siteId, siteId), eq(plcTags.isActive, true))).orderBy(desc(plcTags.createdAt));
    }
    return await db.select().from(plcTags).where(eq(plcTags.isActive, true)).orderBy(desc(plcTags.createdAt));
  }

  async createPlcTag(tag: InsertPlcTag): Promise<PlcTag> {
    const [newTag] = await db.insert(plcTags).values(tag).returning();
    return newTag;
  }

  async bulkCreatePlcTags(siteId: string, tags: Omit<InsertPlcTag, 'siteId'>[]): Promise<PlcTag[]> {
    const tagsWithSiteId = tags.map(tag => ({ ...tag, siteId }));
    const newTags = await db.insert(plcTags).values(tagsWithSiteId).returning();
    return newTags;
  }

  async updatePlcTag(id: string, tag: Partial<InsertPlcTag>): Promise<PlcTag | undefined> {
    const [updatedTag] = await db
      .update(plcTags)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(plcTags.id, id))
      .returning();
    return updatedTag;
  }

  async deletePlcTag(id: string): Promise<boolean> {
    const result = await db.delete(plcTags).where(eq(plcTags.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updatePlcTagValue(id: string, newValue: string, createHistory = true): Promise<void> {
    if (createHistory) {
      // Get current value first for history
      const [currentTag] = await db.select().from(plcTags).where(eq(plcTags.id, id));
      if (currentTag && currentTag.lastValue !== newValue) {
        // Create history record
        await db.insert(plcTagHistory).values({
          tagId: id,
          oldValue: currentTag.lastValue,
          newValue: newValue,
        });

        // Check if we need to create an alert for this tag change
        if (currentTag.alarmOnTrue && newValue.toLowerCase() === 'true') {
          await this.createPlcTagAlert(id, newValue);
        } else if (currentTag.alarmOnFalse && newValue.toLowerCase() === 'false') {
          await this.createPlcTagAlert(id, newValue);
        }
      }
    }
    
    // Update the tag value
    await db
      .update(plcTags)
      .set({ 
        lastValue: newValue, 
        lastReadTime: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(plcTags.id, id));
  }

  async createPlcTagAlert(tagId: string, value: string): Promise<void> {
    // Get the tag details first
    const [tag] = await db.select().from(plcTags).where(eq(plcTags.id, tagId));
    if (!tag) return;

    // Create an alert for this PLC tag event
    await db.insert(alerts).values({
      siteId: tag.siteId,
      type: 'plc_tag_alarm',
      severity: tag.severityLevel as 'info' | 'warning' | 'critical',
      title: `${tag.tagName} Triggered`,
      description: `PLC tag ${tag.tagName} (${tag.plcAddress}) changed to ${value}`,
      isRead: false,
      isResolved: false,
    });
  }

  // PLC Tag History
  async getPlcTagHistory(tagId: string, limit = 100): Promise<PlcTagHistory[]> {
    return await db
      .select()
      .from(plcTagHistory)
      .where(eq(plcTagHistory.tagId, tagId))
      .orderBy(desc(plcTagHistory.timestamp))
      .limit(limit);
  }

  async createPlcTagHistory(history: InsertPlcTagHistory): Promise<PlcTagHistory> {
    const [newHistory] = await db.insert(plcTagHistory).values(history).returning();
    return newHistory;
  }

  // Site Database Tags
  async getSiteDatabaseTags(siteId?: string): Promise<SiteDatabaseTag[]> {
    if (siteId) {
      return await db.select().from(siteDatabaseTags).where(eq(siteDatabaseTags.siteId, siteId));
    }
    return await db.select().from(siteDatabaseTags);
  }

  async createSiteDatabaseTag(tag: InsertSiteDatabaseTag): Promise<SiteDatabaseTag> {
    const [newTag] = await db.insert(siteDatabaseTags).values(tag).returning();
    return newTag;
  }

  async updateSiteDatabaseTag(id: string, tag: Partial<InsertSiteDatabaseTag>): Promise<SiteDatabaseTag | undefined> {
    const [updatedTag] = await db
      .update(siteDatabaseTags)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(siteDatabaseTags.id, id))
      .returning();
    return updatedTag;
  }

  async deleteSiteDatabaseTag(id: string): Promise<boolean> {
    const result = await db.delete(siteDatabaseTags).where(eq(siteDatabaseTags.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Site Database Values
  async getSiteDatabaseValues(tagId: string, limit = 100): Promise<SiteDatabaseValue[]> {
    return await db
      .select()
      .from(siteDatabaseValues)
      .where(eq(siteDatabaseValues.tagId, tagId))
      .orderBy(desc(siteDatabaseValues.timestamp))
      .limit(limit);
  }

  async createSiteDatabaseValue(value: InsertSiteDatabaseValue): Promise<SiteDatabaseValue> {
    const [newValue] = await db.insert(siteDatabaseValues).values(value).returning();
    return newValue;
  }

  async getLatestSiteDatabaseValues(siteId: string): Promise<Array<SiteDatabaseValue & { tag: SiteDatabaseTag }>> {
    // Get the latest value for each tag in a site
    const result = await db
      .select({
        id: siteDatabaseValues.id,
        tagId: siteDatabaseValues.tagId,
        value: siteDatabaseValues.value,
        quality: siteDatabaseValues.quality,
        timestamp: siteDatabaseValues.timestamp,
        tag: siteDatabaseTags,
      })
      .from(siteDatabaseValues)
      .innerJoin(siteDatabaseTags, eq(siteDatabaseValues.tagId, siteDatabaseTags.id))
      .where(eq(siteDatabaseTags.siteId, siteId))
      .orderBy(desc(siteDatabaseValues.timestamp));

    // Filter to get only the latest value for each tag
    const latestValues = new Map();
    result.forEach(row => {
      if (!latestValues.has(row.tagId) || latestValues.get(row.tagId).timestamp < row.timestamp) {
        latestValues.set(row.tagId, row);
      }
    });

    return Array.from(latestValues.values());
  }
}

export const storage = new DatabaseStorage();

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
  mbrRealtimeData,
  roRealtimeData,
  instrumentation,
  plcIoCalculations,
  panelConfigurations,
  instrumentTemplates,
  panelInstruments,
  beckhoffModuleCalculations,
  automationProjects,
  automationVendors,
  automationProducts,
  beckhoffProducts,
  automationPanels,
  communicationModules,
  automationDeviceTemplates,
  siteCalls,
  users,
  roles,
  userRoles,
  sessions,
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
  type MbrRealtimeData,
  type InsertMbrRealtimeData,
  type RoRealtimeData,
  type InsertRoRealtimeData,
  type Instrumentation,
  type InsertInstrumentation,
  type PlcIoCalculation,
  type InsertPlcIoCalculation,
  type PanelConfiguration,
  type InsertPanelConfiguration,
  type InstrumentTemplate,
  type InsertInstrumentTemplate,
  type PanelInstrument,
  type InsertPanelInstrument,
  type BeckhoffModuleCalculation,
  type InsertBeckhoffModuleCalculation,
  type AutomationProject,
  type InsertAutomationProject,
  type AutomationVendor,
  type InsertAutomationVendor,
  type AutomationProduct,
  type InsertAutomationProduct,
  type BeckhoffProduct,
  type InsertBeckhoffProduct,
  type AutomationPanel,
  type InsertAutomationPanel,
  type CommunicationModule,
  type InsertCommunicationModule,
  type AutomationDeviceTemplate,
  type InsertAutomationDeviceTemplate,
  type SiteCall,
  type InsertSiteCall,
  type User,
  type InsertUser,
  type Role,
  type InsertRole,
  type UserRole,
  type InsertUserRole,
  type Session,
  type InsertSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql, count, isNotNull } from "drizzle-orm";
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
  updateProgramBackup(id: string, backup: Partial<InsertProgramBackup>): Promise<ProgramBackup | undefined>;
  deleteProgramBackup(id: string): Promise<boolean>;
  getProgramBackupsByType(type: 'program' | 'hmi', siteId?: string): Promise<ProgramBackup[]>;

  // IPC Credentials
  getIpcManagement(siteId?: string): Promise<IpcManagement[]>;
  createIpcManagement(device: InsertIpcManagement): Promise<IpcManagement>;
  updateIpcManagement(id: string, device: Partial<InsertIpcManagement>): Promise<IpcManagement | undefined>;
  deleteIpcManagement(id: string): Promise<boolean>;

  // Instrumentation
  getInstrumentation(siteId?: string): Promise<Instrumentation[]>;
  createInstrumentation(device: InsertInstrumentation): Promise<Instrumentation>;
  updateInstrumentation(id: string, device: Partial<InsertInstrumentation>): Promise<Instrumentation | undefined>;
  deleteInstrumentation(id: string): Promise<boolean>;
  getInstrumentationByType(deviceType: string, siteId?: string): Promise<Instrumentation[]>;

  // PLC I/O Calculations
  getPlcIoCalculations(siteId?: string): Promise<PlcIoCalculation[]>;
  createPlcIoCalculation(calculation: InsertPlcIoCalculation): Promise<PlcIoCalculation>;
  updatePlcIoCalculation(id: string, calculation: Partial<InsertPlcIoCalculation>): Promise<PlcIoCalculation | undefined>;
  deletePlcIoCalculation(id: string): Promise<boolean>;

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

  // Site Events Configuration
  getSiteEventConfigurations(): Promise<any[]>;
  getCustomSiteEvents(databaseName: string, tableName: string, limit?: number): Promise<any[]>;

  // Site Database Tags
  getSiteDatabaseTags(siteId?: string): Promise<SiteDatabaseTag[]>;
  getSiteDatabaseTag(id: string): Promise<SiteDatabaseTag | undefined>;
  createSiteDatabaseTag(tag: InsertSiteDatabaseTag): Promise<SiteDatabaseTag>;
  updateSiteDatabaseTag(id: string, tag: Partial<InsertSiteDatabaseTag>): Promise<SiteDatabaseTag | undefined>;
  deleteSiteDatabaseTag(id: string): Promise<boolean>;

  // Site Database Values 
  getSiteDatabaseValues(tagId: string, limit?: number): Promise<SiteDatabaseValue[]>;
  createSiteDatabaseValue(value: InsertSiteDatabaseValue): Promise<SiteDatabaseValue>;
  getLatestSiteDatabaseValues(siteId: string): Promise<Array<SiteDatabaseValue & { tag: SiteDatabaseTag }>>;

  // Real-time MBR Data
  getMbrRealtimeData(siteId?: string, limit?: number): Promise<MbrRealtimeData[]>;
  createMbrRealtimeData(data: InsertMbrRealtimeData): Promise<MbrRealtimeData>;
  getLatestMbrRealtimeData(siteId: string): Promise<MbrRealtimeData | undefined>;

  // Real-time RO Data
  getRoRealtimeData(siteId?: string, limit?: number): Promise<RoRealtimeData[]>;
  createRoRealtimeData(data: InsertRoRealtimeData): Promise<RoRealtimeData>;
  getLatestRoRealtimeData(siteId: string): Promise<RoRealtimeData | undefined>;

  // Automation Projects
  getAllAutomationProjects(): Promise<AutomationProject[]>;
  getAutomationProject(id: string): Promise<AutomationProject | undefined>;
  createAutomationProject(project: InsertAutomationProject): Promise<AutomationProject>;
  updateAutomationProject(id: string, project: Partial<InsertAutomationProject>): Promise<AutomationProject | undefined>;
  deleteAutomationProject(id: string): Promise<boolean>;

  // Automation Vendors
  getAllAutomationVendors(): Promise<AutomationVendor[]>;
  getAutomationVendor(id: string): Promise<AutomationVendor | undefined>;
  createAutomationVendor(vendor: InsertAutomationVendor): Promise<AutomationVendor>;
  updateAutomationVendor(id: string, vendor: Partial<InsertAutomationVendor>): Promise<AutomationVendor | undefined>;
  deleteAutomationVendor(id: string): Promise<boolean>;

  // Automation Products
  getAllAutomationProducts(): Promise<AutomationProduct[]>;
  getAutomationProducts(filters: { vendorId?: string; category?: string; subcategory?: string; ioType?: string; productFamily?: string }): Promise<AutomationProduct[]>;
  getAutomationProduct(id: string): Promise<AutomationProduct | undefined>;
  createAutomationProduct(product: InsertAutomationProduct): Promise<AutomationProduct>;
  updateAutomationProduct(id: string, product: Partial<InsertAutomationProduct>): Promise<AutomationProduct | undefined>;
  deleteAutomationProduct(id: string): Promise<boolean>;

  // Beckhoff Products (Legacy - keeping for backward compatibility)
  getAllBeckhoffProducts(): Promise<BeckhoffProduct[]>;
  getBeckhoffProducts(filters: { category?: string; subcategory?: string; ioType?: string }): Promise<BeckhoffProduct[]>;
  getBeckhoffProduct(id: string): Promise<BeckhoffProduct | undefined>;
  createBeckhoffProduct(product: InsertBeckhoffProduct): Promise<BeckhoffProduct>;
  updateBeckhoffProduct(id: string, product: Partial<InsertBeckhoffProduct>): Promise<BeckhoffProduct | undefined>;
  deleteBeckhoffProduct(id: string): Promise<boolean>;

  // Automation Panels
  getAutomationPanels(projectId?: string): Promise<AutomationPanel[]>;
  getAutomationPanel(id: string): Promise<AutomationPanel | undefined>;
  createAutomationPanel(panel: InsertAutomationPanel): Promise<AutomationPanel>;
  updateAutomationPanel(id: string, panel: Partial<InsertAutomationPanel>): Promise<AutomationPanel | undefined>;
  deleteAutomationPanel(id: string): Promise<boolean>;

  // Communication Modules
  getCommunicationModules(projectId?: string): Promise<CommunicationModule[]>;
  getCommunicationModule(id: string): Promise<CommunicationModule | undefined>;
  createCommunicationModule(module: InsertCommunicationModule): Promise<CommunicationModule>;
  updateCommunicationModule(id: string, module: Partial<InsertCommunicationModule>): Promise<CommunicationModule | undefined>;
  deleteCommunicationModule(id: string): Promise<boolean>;

  // Automation Device Templates
  getAutomationDeviceTemplates(filters: { deviceType?: string; category?: string }): Promise<AutomationDeviceTemplate[]>;
  getAutomationDeviceTemplate(id: string): Promise<AutomationDeviceTemplate | undefined>;
  createAutomationDeviceTemplate(template: InsertAutomationDeviceTemplate): Promise<AutomationDeviceTemplate>;
  updateAutomationDeviceTemplate(id: string, template: Partial<InsertAutomationDeviceTemplate>): Promise<AutomationDeviceTemplate | undefined>;
  deleteAutomationDeviceTemplate(id: string): Promise<boolean>;

  // User Management
  getAllUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Role Management
  getAllRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  // User Role Management
  getUserRoles(userId: string): Promise<UserRole[]>;
  assignUserRole(userRole: InsertUserRole): Promise<UserRole>;
  removeUserRole(userId: string, roleId: string): Promise<boolean>;
  
  // Session Management
  createSession(session: InsertSession): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  updateSessionActivity(token: string): Promise<void>;
  deleteSession(token: string): Promise<boolean>;

  // Site Calls Management
  getAllSiteCalls(): Promise<SiteCall[]>;
  getSiteCalls(filters: { siteId?: string; status?: string; issueType?: string; assignedEngineer?: string }): Promise<SiteCall[]>;
  getSiteCall(id: string): Promise<SiteCall | undefined>;
  createSiteCall(siteCall: InsertSiteCall): Promise<SiteCall>;
  updateSiteCall(id: string, siteCall: Partial<InsertSiteCall>): Promise<SiteCall | undefined>;
  deleteSiteCall(id: string): Promise<boolean>;
  generateCallNumber(): Promise<string>;
  deleteUserSessions(userId: string): Promise<void>;
  
  // Authentication
  validateUserCredentials(email: string, password: string): Promise<User | null>;
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

  async updateProgramBackup(id: string, backup: Partial<InsertProgramBackup>): Promise<ProgramBackup | undefined> {
    const [updatedBackup] = await db
      .update(programBackups)
      .set({ ...backup, updatedAt: new Date() })
      .where(eq(programBackups.id, id))
      .returning();
    return updatedBackup;
  }

  async deleteProgramBackup(id: string): Promise<boolean> {
    const result = await db.delete(programBackups).where(eq(programBackups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getProgramBackupsByType(type: 'program' | 'hmi', siteId?: string): Promise<ProgramBackup[]> {
    if (siteId) {
      return await db.select().from(programBackups)
        .where(and(eq(programBackups.type, type), eq(programBackups.siteId, siteId)))
        .orderBy(desc(programBackups.createdAt));
    }
    return await db.select().from(programBackups)
      .where(eq(programBackups.type, type))
      .orderBy(desc(programBackups.createdAt));
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
    
    // Temporarily remove ipcImage field until database migration is complete
    const { ipcImage, ...deviceWithoutImage } = processedDevice as any;
    
    const [newDevice] = await db
      .insert(ipcManagement)
      .values(deviceWithoutImage)
      .returning();
    return newDevice;
  }

  async updateIpcManagement(id: string, device: Partial<InsertIpcManagement>): Promise<IpcManagement | undefined> {
    const updateData = { ...device, updatedAt: new Date() };
    
    // Encrypt password if provided
    if (device.ipcPassword) {
      updateData.ipcPassword = await bcrypt.hash(device.ipcPassword, 10);
    }

    // Temporarily remove ipcImage field until database migration is complete
    const { ipcImage, ...updateWithoutImage } = updateData as any;

    const [updatedDevice] = await db
      .update(ipcManagement)
      .set(updateWithoutImage)
      .where(eq(ipcManagement.id, id))
      .returning();
    return updatedDevice;
  }

  async deleteIpcManagement(id: string): Promise<boolean> {
    const result = await db.delete(ipcManagement).where(eq(ipcManagement.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Instrumentation
  async getInstrumentation(siteId?: string): Promise<Instrumentation[]> {
    const query = db.select().from(instrumentation);
    if (siteId) {
      return await query.where(eq(instrumentation.siteId, siteId)).orderBy(desc(instrumentation.createdAt));
    }
    return await query.orderBy(desc(instrumentation.createdAt));
  }

  async createInstrumentation(device: InsertInstrumentation): Promise<Instrumentation> {
    const [newDevice] = await db
      .insert(instrumentation)
      .values(device)
      .returning();
    return newDevice;
  }

  async updateInstrumentation(id: string, device: Partial<InsertInstrumentation>): Promise<Instrumentation | undefined> {
    const updateData = { ...device, updatedAt: new Date() };

    const [updatedDevice] = await db
      .update(instrumentation)
      .set(updateData)
      .where(eq(instrumentation.id, id))
      .returning();
    return updatedDevice;
  }

  async deleteInstrumentation(id: string): Promise<boolean> {
    const result = await db.delete(instrumentation).where(eq(instrumentation.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getInstrumentationByType(deviceType: string, siteId?: string): Promise<Instrumentation[]> {
    if (siteId) {
      return await db.select().from(instrumentation)
        .where(and(eq(instrumentation.deviceType, deviceType), eq(instrumentation.siteId, siteId)))
        .orderBy(desc(instrumentation.createdAt));
    }
    return await db.select().from(instrumentation)
      .where(eq(instrumentation.deviceType, deviceType))
      .orderBy(desc(instrumentation.createdAt));
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

  // Site Events Database Configuration Methods
  async getSiteEventConfigurations(): Promise<any[]> {
    try {
      const ipcDevices = await db
        .select({
          id: ipcManagement.id,
          deviceName: ipcManagement.deviceName,
          siteName: sites.name,
          siteId: ipcManagement.siteId,
          eventsDatabaseName: ipcManagement.eventsDatabaseName,
          eventsTableName: ipcManagement.eventsTableName,
        })
        .from(ipcManagement)
        .leftJoin(sites, eq(ipcManagement.siteId, sites.id))
        .where(and(
          isNotNull(ipcManagement.eventsDatabaseName),
          isNotNull(ipcManagement.eventsTableName)
        ));
      
      return ipcDevices.filter(device => device.eventsDatabaseName && device.eventsTableName);
    } catch (error) {
      console.error("Error fetching site event configurations:", error);
      return [];
    }
  }

  async getCustomSiteEvents(databaseName: string, tableName: string, limit: number = 100): Promise<any[]> {
    try {
      // Import the external database service dynamically
      const { externalDatabaseService } = await import('./services/externalDatabaseService');
      const events = await externalDatabaseService.queryCustomSiteEvents(databaseName, tableName, limit);
      return events;
    } catch (error) {
      console.error(`Error querying custom site events from ${databaseName}.${tableName}:`, error);
      return [];
    }
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
      message: `PLC tag ${tag.tagName} (${tag.plcAddress}) changed to ${value}`,
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

  async getSiteDatabaseTag(id: string): Promise<SiteDatabaseTag | undefined> {
    const [tag] = await db.select().from(siteDatabaseTags).where(eq(siteDatabaseTags.id, id));
    return tag;
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

  // Real-time MBR Data methods
  async getMbrRealtimeData(siteId?: string, limit = 100): Promise<MbrRealtimeData[]> {
    const query = db.select().from(mbrRealtimeData);
    
    if (siteId) {
      return await query
        .where(eq(mbrRealtimeData.siteId, siteId))
        .orderBy(desc(mbrRealtimeData.timestamp))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(mbrRealtimeData.timestamp))
      .limit(limit);
  }

  async createMbrRealtimeData(data: InsertMbrRealtimeData): Promise<MbrRealtimeData> {
    const [newData] = await db.insert(mbrRealtimeData).values(data).returning();
    return newData;
  }

  async getLatestMbrRealtimeData(siteId: string): Promise<MbrRealtimeData | undefined> {
    const [latest] = await db
      .select()
      .from(mbrRealtimeData)
      .where(eq(mbrRealtimeData.siteId, siteId))
      .orderBy(desc(mbrRealtimeData.timestamp))
      .limit(1);
    return latest;
  }

  // Real-time RO Data methods
  async getRoRealtimeData(siteId?: string, limit = 100): Promise<RoRealtimeData[]> {
    const query = db.select().from(roRealtimeData);
    
    if (siteId) {
      return await query
        .where(eq(roRealtimeData.siteId, siteId))
        .orderBy(desc(roRealtimeData.timestamp))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(roRealtimeData.timestamp))
      .limit(limit);
  }

  async createRoRealtimeData(data: InsertRoRealtimeData): Promise<RoRealtimeData> {
    const [newData] = await db.insert(roRealtimeData).values(data).returning();
    return newData;
  }

  async getLatestRoRealtimeData(siteId: string): Promise<RoRealtimeData | undefined> {
    const [latest] = await db
      .select()
      .from(roRealtimeData)
      .where(eq(roRealtimeData.siteId, siteId))
      .orderBy(desc(roRealtimeData.timestamp))
      .limit(1);
    return latest;
  }

  // PLC I/O Calculations methods
  async getPlcIoCalculations(siteId?: string): Promise<PlcIoCalculation[]> {
    const query = db.select().from(plcIoCalculations);
    
    if (siteId && siteId !== "all") {
      return await query
        .where(eq(plcIoCalculations.siteId, siteId))
        .orderBy(desc(plcIoCalculations.createdAt));
    }
    
    return await query.orderBy(desc(plcIoCalculations.createdAt));
  }

  async createPlcIoCalculation(calculation: InsertPlcIoCalculation): Promise<PlcIoCalculation> {
    const [newCalculation] = await db
      .insert(plcIoCalculations)
      .values(calculation)
      .returning();
    return newCalculation;
  }

  async updatePlcIoCalculation(id: string, calculation: Partial<InsertPlcIoCalculation>): Promise<PlcIoCalculation | undefined> {
    const [updated] = await db
      .update(plcIoCalculations)
      .set({ ...calculation, updatedAt: new Date() })
      .where(eq(plcIoCalculations.id, id))
      .returning();
    return updated;
  }

  async deletePlcIoCalculation(id: string): Promise<boolean> {
    const result = await db
      .delete(plcIoCalculations)
      .where(eq(plcIoCalculations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Panel Configuration Management
  async getPanelConfigurations(siteId?: string): Promise<PanelConfiguration[]> {
    const query = db.select().from(panelConfigurations);
    
    if (siteId && siteId !== "all") {
      return await query
        .where(eq(panelConfigurations.siteId, siteId))
        .orderBy(desc(panelConfigurations.createdAt));
    }
    
    return await query.orderBy(desc(panelConfigurations.createdAt));
  }

  async createPanelConfiguration(panel: InsertPanelConfiguration): Promise<PanelConfiguration> {
    const [newPanel] = await db
      .insert(panelConfigurations)
      .values(panel)
      .returning();
    return newPanel;
  }

  async updatePanelConfiguration(id: string, panel: Partial<InsertPanelConfiguration>): Promise<PanelConfiguration | undefined> {
    const [updated] = await db
      .update(panelConfigurations)
      .set({ ...panel, updatedAt: new Date() })
      .where(eq(panelConfigurations.id, id))
      .returning();
    return updated;
  }

  async deletePanelConfiguration(id: string): Promise<boolean> {
    const result = await db
      .delete(panelConfigurations)
      .where(eq(panelConfigurations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Instrument Template Management
  async getInstrumentTemplates(): Promise<InstrumentTemplate[]> {
    return await db
      .select()
      .from(instrumentTemplates)
      .orderBy(instrumentTemplates.instrumentType, instrumentTemplates.templateName);
  }

  async createInstrumentTemplate(template: InsertInstrumentTemplate): Promise<InstrumentTemplate> {
    const [newTemplate] = await db
      .insert(instrumentTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateInstrumentTemplate(id: string, template: Partial<InsertInstrumentTemplate>): Promise<InstrumentTemplate | undefined> {
    const [updated] = await db
      .update(instrumentTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(instrumentTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteInstrumentTemplate(id: string): Promise<boolean> {
    const result = await db
      .delete(instrumentTemplates)
      .where(eq(instrumentTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Panel Instrument Management
  async getPanelInstruments(panelId: string): Promise<PanelInstrument[]> {
    return await db
      .select()
      .from(panelInstruments)
      .where(eq(panelInstruments.panelId, panelId))
      .orderBy(panelInstruments.instrumentName);
  }

  async createPanelInstrument(instrument: InsertPanelInstrument): Promise<PanelInstrument> {
    const [newInstrument] = await db
      .insert(panelInstruments)
      .values(instrument)
      .returning();
    return newInstrument;
  }

  async updatePanelInstrument(id: string, instrument: Partial<InsertPanelInstrument>): Promise<PanelInstrument | undefined> {
    const [updated] = await db
      .update(panelInstruments)
      .set({ ...instrument, updatedAt: new Date() })
      .where(eq(panelInstruments.id, id))
      .returning();
    return updated;
  }

  async deletePanelInstrument(id: string): Promise<boolean> {
    const result = await db
      .delete(panelInstruments)
      .where(eq(panelInstruments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Beckhoff Module Calculation Management
  async getBeckhoffModuleCalculations(panelId?: string): Promise<BeckhoffModuleCalculation[]> {
    const query = db.select().from(beckhoffModuleCalculations);
    
    if (panelId) {
      return await query
        .where(eq(beckhoffModuleCalculations.panelId, panelId))
        .orderBy(desc(beckhoffModuleCalculations.createdAt));
    }
    
    return await query.orderBy(desc(beckhoffModuleCalculations.createdAt));
  }

  async createBeckhoffModuleCalculation(calculation: InsertBeckhoffModuleCalculation): Promise<BeckhoffModuleCalculation> {
    const [newCalculation] = await db
      .insert(beckhoffModuleCalculations)
      .values(calculation)
      .returning();
    return newCalculation;
  }

  async updateBeckhoffModuleCalculation(id: string, calculation: Partial<InsertBeckhoffModuleCalculation>): Promise<BeckhoffModuleCalculation | undefined> {
    const [updated] = await db
      .update(beckhoffModuleCalculations)
      .set({ ...calculation, updatedAt: new Date() })
      .where(eq(beckhoffModuleCalculations.id, id))
      .returning();
    return updated;
  }

  async deleteBeckhoffModuleCalculation(id: string): Promise<boolean> {
    const result = await db
      .delete(beckhoffModuleCalculations)
      .where(eq(beckhoffModuleCalculations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ==========================================
  // AUTOMATION WIZARD IMPLEMENTATIONS
  // ==========================================

  // Automation Projects
  async getAllAutomationProjects(): Promise<AutomationProject[]> {
    return await db
      .select()
      .from(automationProjects)
      .orderBy(desc(automationProjects.createdAt));
  }

  async getAutomationProject(id: string): Promise<AutomationProject | undefined> {
    const [project] = await db
      .select()
      .from(automationProjects)
      .where(eq(automationProjects.id, id));
    return project;
  }

  async createAutomationProject(project: InsertAutomationProject): Promise<AutomationProject> {
    const [newProject] = await db
      .insert(automationProjects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateAutomationProject(id: string, project: Partial<InsertAutomationProject>): Promise<AutomationProject | undefined> {
    const [updated] = await db
      .update(automationProjects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(automationProjects.id, id))
      .returning();
    return updated;
  }

  async deleteAutomationProject(id: string): Promise<boolean> {
    const result = await db
      .delete(automationProjects)
      .where(eq(automationProjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Beckhoff Products
  async getAllBeckhoffProducts(): Promise<BeckhoffProduct[]> {
    return await db
      .select()
      .from(beckhoffProducts)
      .where(eq(beckhoffProducts.isActive, true))
      .orderBy(beckhoffProducts.category, beckhoffProducts.partNumber);
  }

  async getBeckhoffProducts(filters: { category?: string; subcategory?: string; ioType?: string }): Promise<BeckhoffProduct[]> {
    const query = db
      .select()
      .from(beckhoffProducts)
      .where(eq(beckhoffProducts.isActive, true));

    const conditions = [];
    if (filters.category) {
      conditions.push(eq(beckhoffProducts.category, filters.category));
    }
    if (filters.subcategory) {
      conditions.push(eq(beckhoffProducts.subcategory, filters.subcategory));
    }
    if (filters.ioType) {
      conditions.push(eq(beckhoffProducts.ioType, filters.ioType));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(beckhoffProducts.partNumber);
    }

    return await query.orderBy(beckhoffProducts.category, beckhoffProducts.partNumber);
  }

  async getBeckhoffProduct(id: string): Promise<BeckhoffProduct | undefined> {
    const [product] = await db
      .select()
      .from(beckhoffProducts)
      .where(eq(beckhoffProducts.id, id));
    return product;
  }

  async createBeckhoffProduct(product: InsertBeckhoffProduct): Promise<BeckhoffProduct> {
    const [newProduct] = await db
      .insert(beckhoffProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateBeckhoffProduct(id: string, product: Partial<InsertBeckhoffProduct>): Promise<BeckhoffProduct | undefined> {
    const [updated] = await db
      .update(beckhoffProducts)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(beckhoffProducts.id, id))
      .returning();
    return updated;
  }

  async deleteBeckhoffProduct(id: string): Promise<boolean> {
    const result = await db
      .update(beckhoffProducts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(beckhoffProducts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Automation Vendors
  async getAllAutomationVendors(): Promise<AutomationVendor[]> {
    return await db
      .select()
      .from(automationVendors)
      .where(eq(automationVendors.isActive, true))
      .orderBy(automationVendors.vendorDisplayName);
  }

  async getAutomationVendor(id: string): Promise<AutomationVendor | undefined> {
    const [vendor] = await db
      .select()
      .from(automationVendors)
      .where(eq(automationVendors.id, id));
    return vendor;
  }

  async createAutomationVendor(vendor: InsertAutomationVendor): Promise<AutomationVendor> {
    const [newVendor] = await db
      .insert(automationVendors)
      .values(vendor)
      .returning();
    return newVendor;
  }

  async updateAutomationVendor(id: string, vendor: Partial<InsertAutomationVendor>): Promise<AutomationVendor | undefined> {
    const [updated] = await db
      .update(automationVendors)
      .set({ ...vendor, updatedAt: new Date() })
      .where(eq(automationVendors.id, id))
      .returning();
    return updated;
  }

  async deleteAutomationVendor(id: string): Promise<boolean> {
    const result = await db
      .update(automationVendors)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(automationVendors.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Automation Products
  async getAllAutomationProducts(): Promise<AutomationProduct[]> {
    return await db
      .select()
      .from(automationProducts)
      .where(eq(automationProducts.isActive, true))
      .orderBy(automationProducts.category, automationProducts.productDisplayName);
  }

  async getAutomationProducts(filters: { vendorId?: string; category?: string; subcategory?: string; ioType?: string; productFamily?: string }): Promise<AutomationProduct[]> {
    const query = db
      .select()
      .from(automationProducts)
      .where(eq(automationProducts.isActive, true));

    const conditions = [];
    if (filters.vendorId) {
      conditions.push(eq(automationProducts.vendorId, filters.vendorId));
    }
    if (filters.category) {
      conditions.push(eq(automationProducts.category, filters.category));
    }
    if (filters.subcategory) {
      conditions.push(eq(automationProducts.subcategory, filters.subcategory));
    }
    if (filters.ioType) {
      conditions.push(eq(automationProducts.ioType, filters.ioType));
    }
    if (filters.productFamily) {
      conditions.push(eq(automationProducts.productFamily, filters.productFamily));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(automationProducts.productDisplayName);
    }

    return await query.orderBy(automationProducts.category, automationProducts.productDisplayName);
  }

  async getAutomationProduct(id: string): Promise<AutomationProduct | undefined> {
    const [product] = await db
      .select()
      .from(automationProducts)
      .where(eq(automationProducts.id, id));
    return product;
  }

  async createAutomationProduct(product: InsertAutomationProduct): Promise<AutomationProduct> {
    const [newProduct] = await db
      .insert(automationProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateAutomationProduct(id: string, product: Partial<InsertAutomationProduct>): Promise<AutomationProduct | undefined> {
    const [updated] = await db
      .update(automationProducts)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(automationProducts.id, id))
      .returning();
    return updated;
  }

  async deleteAutomationProduct(id: string): Promise<boolean> {
    const result = await db
      .update(automationProducts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(automationProducts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Automation Panels
  async getAutomationPanels(projectId?: string): Promise<AutomationPanel[]> {
    const query = db
      .select()
      .from(automationPanels)
      .where(eq(automationPanels.isActive, true));

    if (projectId) {
      return await query
        .where(and(eq(automationPanels.projectId, projectId), eq(automationPanels.isActive, true)))
        .orderBy(automationPanels.hierarchyLevel, automationPanels.panelName);
    }

    return await query.orderBy(automationPanels.hierarchyLevel, automationPanels.panelName);
  }

  async getAutomationPanel(id: string): Promise<AutomationPanel | undefined> {
    const [panel] = await db
      .select()
      .from(automationPanels)
      .where(eq(automationPanels.id, id));
    return panel;
  }

  async createAutomationPanel(panel: InsertAutomationPanel): Promise<AutomationPanel> {
    const [newPanel] = await db
      .insert(automationPanels)
      .values(panel)
      .returning();
    return newPanel;
  }

  async updateAutomationPanel(id: string, panel: Partial<InsertAutomationPanel>): Promise<AutomationPanel | undefined> {
    const [updated] = await db
      .update(automationPanels)
      .set({ ...panel, updatedAt: new Date() })
      .where(eq(automationPanels.id, id))
      .returning();
    return updated;
  }

  async deleteAutomationPanel(id: string): Promise<boolean> {
    const result = await db
      .update(automationPanels)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(automationPanels.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Communication Modules
  async getCommunicationModules(projectId?: string): Promise<CommunicationModule[]> {
    const query = db.select().from(communicationModules);

    if (projectId) {
      return await query
        .where(eq(communicationModules.projectId, projectId))
        .orderBy(communicationModules.moduleName);
    }

    return await query.orderBy(communicationModules.moduleName);
  }

  async getCommunicationModule(id: string): Promise<CommunicationModule | undefined> {
    const [module] = await db
      .select()
      .from(communicationModules)
      .where(eq(communicationModules.id, id));
    return module;
  }

  async createCommunicationModule(module: InsertCommunicationModule): Promise<CommunicationModule> {
    const [newModule] = await db
      .insert(communicationModules)
      .values(module)
      .returning();
    return newModule;
  }

  async updateCommunicationModule(id: string, module: Partial<InsertCommunicationModule>): Promise<CommunicationModule | undefined> {
    const [updated] = await db
      .update(communicationModules)
      .set({ ...module, updatedAt: new Date() })
      .where(eq(communicationModules.id, id))
      .returning();
    return updated;
  }

  async deleteCommunicationModule(id: string): Promise<boolean> {
    const result = await db
      .delete(communicationModules)
      .where(eq(communicationModules.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Automation Device Templates
  async getAutomationDeviceTemplates(filters: { deviceType?: string; category?: string }): Promise<AutomationDeviceTemplate[]> {
    const query = db
      .select()
      .from(automationDeviceTemplates)
      .where(eq(automationDeviceTemplates.isActive, true));

    const conditions = [eq(automationDeviceTemplates.isActive, true)];
    if (filters.deviceType) {
      conditions.push(eq(automationDeviceTemplates.deviceType, filters.deviceType));
    }
    if (filters.category) {
      conditions.push(eq(automationDeviceTemplates.category, filters.category));
    }

    return await query
      .where(and(...conditions))
      .orderBy(automationDeviceTemplates.category, automationDeviceTemplates.templateName);
  }

  async getAutomationDeviceTemplate(id: string): Promise<AutomationDeviceTemplate | undefined> {
    const [template] = await db
      .select()
      .from(automationDeviceTemplates)
      .where(eq(automationDeviceTemplates.id, id));
    return template;
  }

  async createAutomationDeviceTemplate(template: InsertAutomationDeviceTemplate): Promise<AutomationDeviceTemplate> {
    const [newTemplate] = await db
      .insert(automationDeviceTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateAutomationDeviceTemplate(id: string, template: Partial<InsertAutomationDeviceTemplate>): Promise<AutomationDeviceTemplate | undefined> {
    const [updated] = await db
      .update(automationDeviceTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(automationDeviceTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteAutomationDeviceTemplate(id: string): Promise<boolean> {
    const result = await db
      .update(automationDeviceTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(automationDeviceTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Management Implementation
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.createdAt);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
        fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
      })
      .returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...user, updatedAt: new Date() };
    
    // Hash password if it's being updated
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }
    
    // Update full name if first or last name is being updated
    if (user.firstName || user.lastName) {
      const existingUser = await this.getUser(id);
      if (existingUser) {
        const firstName = user.firstName ?? existingUser.firstName;
        const lastName = user.lastName ?? existingUser.lastName;
        updateData.fullName = firstName && lastName ? `${firstName} ${lastName}` : null;
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Role Management Implementation
  async getAllRoles(): Promise<Role[]> {
    return await db
      .select()
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(roles.name);
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name));
    return role;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values(role)
      .returning();
    return newRole;
  }

  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db
      .update(roles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(roles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Role Management Implementation
  async getUserRoles(userId: string): Promise<UserRole[]> {
    return await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .orderBy(userRoles.assignedAt);
  }

  async assignUserRole(userRole: InsertUserRole): Promise<UserRole> {
    const [newUserRole] = await db
      .insert(userRoles)
      .values(userRole)
      .returning();
    return newUserRole;
  }

  async removeUserRole(userId: string, roleId: string): Promise<boolean> {
    const result = await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Session Management Implementation
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.token, token),
        eq(sessions.isActive, true),
        gte(sessions.expiresAt, new Date())
      ));
    return session;
  }

  async updateSessionActivity(token: string): Promise<void> {
    await db
      .update(sessions)
      .set({ lastActivity: new Date() })
      .where(eq(sessions.token, token));
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.token, token));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.userId, userId));
  }

  // Site Calls Management Implementation
  async getAllSiteCalls(): Promise<SiteCall[]> {
    return await db
      .select()
      .from(siteCalls)
      .orderBy(desc(siteCalls.reportedAt));
  }

  async getSiteCalls(filters: { siteId?: string; status?: string; issueType?: string; assignedEngineer?: string }): Promise<SiteCall[]> {
    const query = db
      .select()
      .from(siteCalls);

    const conditions = [];
    if (filters.siteId) {
      conditions.push(eq(siteCalls.siteId, filters.siteId));
    }
    if (filters.status) {
      conditions.push(eq(siteCalls.callStatus, filters.status));
    }
    if (filters.issueType) {
      conditions.push(eq(siteCalls.issueType, filters.issueType));
    }
    if (filters.assignedEngineer) {
      conditions.push(eq(siteCalls.assignedEngineer, filters.assignedEngineer));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(siteCalls.reportedAt));
    }

    return await query.orderBy(desc(siteCalls.reportedAt));
  }

  async getSiteCall(id: string): Promise<SiteCall | undefined> {
    const [siteCall] = await db
      .select()
      .from(siteCalls)
      .where(eq(siteCalls.id, id));
    return siteCall;
  }

  async createSiteCall(siteCall: InsertSiteCall): Promise<SiteCall> {
    // Generate call number if not provided
    const callNumber = siteCall.callNumber || await this.generateCallNumber();
    
    const [newSiteCall] = await db
      .insert(siteCalls)
      .values({
        ...siteCall,
        callNumber,
      })
      .returning();
    return newSiteCall;
  }

  async updateSiteCall(id: string, siteCall: Partial<InsertSiteCall>): Promise<SiteCall | undefined> {
    const [updated] = await db
      .update(siteCalls)
      .set({
        ...siteCall,
        updatedAt: new Date(),
      })
      .where(eq(siteCalls.id, id))
      .returning();
    return updated;
  }

  async deleteSiteCall(id: string): Promise<boolean> {
    const result = await db
      .delete(siteCalls)
      .where(eq(siteCalls.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async generateCallNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `CALL-${year}${month}`;
    
    // Get the count of calls for this month
    const [result] = await db
      .select({ count: count() })
      .from(siteCalls)
      .where(sql`${siteCalls.callNumber} LIKE '${prefix}%'`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Authentication Implementation
  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    // Update last login
    await this.updateUser(user.id, { lastLoginAt: new Date() });
    
    return user;
  }
}

export const storage = new DatabaseStorage();

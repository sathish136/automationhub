import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pingService } from "./services/pingService";
import { adsMonitoringService } from "./services/adsMonitoringService";
import { sqlViewerService } from "./services/sqlViewerService";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { 
  insertSiteSchema, 
  insertIpcManagementSchema, 
  insertVfdParameterSchema, 
  insertProgramBackupSchema,
  insertProjectSchema,
  insertPlcTagSchema,
  insertPlcTagHistorySchema,
  insertSiteDatabaseTagSchema,
  insertSiteDatabaseValueSchema,
  insertMbrRealtimeDataSchema,
  insertRoRealtimeDataSchema,
  insertInstrumentationSchema,
  insertPlcIoCalculationSchema,
  insertAutomationProjectSchema,
  insertAutomationVendorSchema,
  insertAutomationProductSchema,
  insertBeckhoffProductSchema,
  insertAutomationPanelSchema,
  insertCommunicationModuleSchema,
  insertAutomationDeviceTemplateSchema,
  insertUserSchema,
  insertRoleSchema,
  insertUserRoleSchema
} from "@shared/schema";
import crypto from "crypto";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Authentication middleware
async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.substring(7);
    const session = await storage.getSession(token);
    
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await storage.getUser(session.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    // Update session activity
    await storage.updateSessionActivity(token);

    // Attach user to request
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Start ping monitoring service
  pingService.startMonitoring();

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.validateUserCredentials(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createSession({
        userId: user.id,
        token,
        userAgent: req.get('User-Agent') || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        expiresAt,
      });

      // Get user roles
      const userRoles = await storage.getUserRoles(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
        },
        token,
        roles: userRoles,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const user = await storage.createUser(userData);

      // Assign default role (viewer) if available
      const viewerRole = await storage.getRoleByName('viewer');
      if (viewerRole) {
        await storage.assignUserRole({
          userId: user.id,
          roleId: viewerRole.id,
        });
      }

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No valid token provided" });
      }

      const token = authHeader.substring(7);
      await storage.deleteSession(token);

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No valid token provided" });
      }

      const token = authHeader.substring(7);
      const session = await storage.getSession(token);
      
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Update session activity
      await storage.updateSessionActivity(token);

      const user = await storage.getUser(session.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found or inactive" });
      }

      const userRoles = await storage.getUserRoles(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
        },
        roles: userRoles,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management endpoints (protected)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({
        ...user,
        password: undefined,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        ...user,
        password: undefined,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        ...user,
        password: undefined,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Role management endpoints
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", requireAuth, async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(400).json({ message: "Invalid role data" });
    }
  });

  // User role assignment endpoints
  app.post("/api/users/:userId/roles", requireAuth, async (req, res) => {
    try {
      const { roleId } = req.body;
      if (!roleId) {
        return res.status(400).json({ message: "Role ID is required" });
      }

      // Check if user already has this role
      const existingRoles = await storage.getUserRoles(req.params.userId);
      const hasRole = existingRoles.some(userRole => userRole.roleId === roleId);
      
      if (hasRole) {
        return res.status(409).json({ message: "User already has this role assigned" });
      }

      const userRole = await storage.assignUserRole({
        userId: req.params.userId,
        roleId,
      });
      res.status(201).json(userRole);
    } catch (error: any) {
      console.error("Error assigning role:", error);
      
      // Handle duplicate key constraint specifically
      if (error.code === '23505') {
        return res.status(409).json({ message: "User already has this role assigned" });
      }
      
      res.status(400).json({ message: "Failed to assign role" });
    }
  });

  app.delete("/api/users/:userId/roles/:roleId", requireAuth, async (req, res) => {
    try {
      const success = await storage.removeUserRole(req.params.userId, req.params.roleId);
      if (!success) {
        return res.status(404).json({ message: "User role assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing role:", error);
      res.status(500).json({ message: "Failed to remove role" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      // Handle date string conversion before schema validation
      const bodyData = { ...req.body };
      if (bodyData.createdDate && typeof bodyData.createdDate === 'string') {
        bodyData.createdDate = new Date(bodyData.createdDate);
      }
      if (bodyData.planStartDate && typeof bodyData.planStartDate === 'string') {
        bodyData.planStartDate = new Date(bodyData.planStartDate);
      }
      
      const projectData = insertProjectSchema.parse(bodyData);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Sites endpoints
  app.get("/api/sites", async (req, res) => {
    try {
      const sites = await storage.getAllSites();
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.get("/api/sites/:id", async (req, res) => {
    try {
      const site = await storage.getSite(req.params.id);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error fetching site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.post("/api/sites", async (req, res) => {
    try {
      const siteData = insertSiteSchema.parse(req.body);
      const site = await storage.createSite(siteData);
      res.status(201).json(site);
    } catch (error) {
      console.error("Error creating site:", error);
      res.status(400).json({ message: "Invalid site data" });
    }
  });

  app.put("/api/sites/:id", async (req, res) => {
    try {
      const siteData = insertSiteSchema.partial().parse(req.body);
      const site = await storage.updateSite(req.params.id, siteData);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error updating site:", error);
      res.status(400).json({ message: "Invalid site data" });
    }
  });

  app.delete("/api/sites/:id", async (req, res) => {
    try {
      const success = await storage.deleteSite(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting site:", error);
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Sync sites from IPC management
  app.post("/api/sites/sync-from-ipc", async (req, res) => {
    try {
      const ipcDevices = await storage.getIpcManagement();
      let existingSites = await storage.getAllSites();
      
      // Collect all valid IPs from IPC devices
      const validIPs = new Set<string>();
      for (const ipc of ipcDevices) {
        if (ipc.vpnIp) validIPs.add(ipc.vpnIp);
        if (ipc.lanIp) validIPs.add(ipc.lanIp);
      }
      
      let created = 0;
      let removed = 0;
      
      // Remove orphaned sites that no longer have corresponding IPC devices
      for (const site of existingSites) {
        if (!validIPs.has(site.ipAddress)) {
          await storage.deleteSite(site.id);
          removed++;
          console.log(`Removed orphaned site: ${site.name} (${site.ipAddress})`);
        }
      }
      
      // Refresh existing sites after deletions
      existingSites = await storage.getAllSites();
      const existingIPs = new Set(existingSites.map(site => site.ipAddress));
      
      // Create new sites for IPC devices
      for (const ipc of ipcDevices) {
        // Create sites for VPN IPs
        if (ipc.vpnIp && !existingIPs.has(ipc.vpnIp)) {
          try {
            await storage.createSite({
              name: `${ipc.deviceName} (VPN)`,
              description: `Monitoring ${ipc.deviceName} via VPN connection`,
              ipAddress: ipc.vpnIp,
              siteType: "production",
              location: null,
              isActive: true,
            });
            created++;
            existingIPs.add(ipc.vpnIp);
          } catch (error: any) {
            // Skip if duplicate (might be created by another sync operation)
            if (error.code !== '23505') {
              throw error;
            }
            console.log(`Site with VPN IP ${ipc.vpnIp} already exists, skipping...`);
          }
        }
        
        // Create sites for LAN IPs
        if (ipc.lanIp && !existingIPs.has(ipc.lanIp)) {
          try {
            await storage.createSite({
              name: `${ipc.deviceName} (LAN)`,
              description: `Monitoring ${ipc.deviceName} via LAN connection`,
              ipAddress: ipc.lanIp,
              siteType: "production", 
              location: null,
              isActive: true,
            });
            created++;
            existingIPs.add(ipc.lanIp);
          } catch (error: any) {
            // Skip if duplicate (might be created by another sync operation)
            if (error.code !== '23505') {
              throw error;
            }
            console.log(`Site with LAN IP ${ipc.lanIp} already exists, skipping...`);
          }
        }
      }
      
      res.json({ created, removed, total: ipcDevices.length });
    } catch (error) {
      console.error("Error syncing sites from IPC:", error);
      res.status(500).json({ message: "Failed to sync sites from IPC management" });
    }
  });

  // Ping endpoints
  app.post("/api/sites/:id/ping", async (req, res) => {
    try {
      const site = await storage.getSite(req.params.id);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      await pingService.checkSiteStatus(site.id, site.ipAddress, site.name);
      const updatedSite = await storage.getSite(req.params.id);
      res.json(updatedSite);
    } catch (error) {
      console.error("Error pinging site:", error);
      res.status(500).json({ message: "Failed to ping site" });
    }
  });

  app.post("/api/ping/all", async (req, res) => {
    try {
      await pingService.checkAllSites();
      res.json({ message: "Ping check initiated for all sites" });
    } catch (error) {
      console.error("Error pinging all sites:", error);
      res.status(500).json({ message: "Failed to ping all sites" });
    }
  });

  // Uptime history
  app.get("/api/sites/:id/uptime", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await storage.getUptimeHistory(req.params.id, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching uptime history:", error);
      res.status(500).json({ message: "Failed to fetch uptime history" });
    }
  });

  app.get("/api/sites/:id/uptime/stats", async (req, res) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const stats = await storage.getUptimeStats(req.params.id, hours);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching uptime stats:", error);
      res.status(500).json({ message: "Failed to fetch uptime stats" });
    }
  });

  // Program backups - Enhanced with detailed tracking
  app.get("/api/backups", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const type = req.query.type as 'program' | 'hmi' | undefined;
      
      let backups;
      if (type) {
        backups = await storage.getProgramBackupsByType(type, siteId);
      } else {
        backups = await storage.getProgramBackups(siteId);
      }
      res.json(backups);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });

  app.post("/api/backups", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse and validate the backup data with enhanced fields
      const backupData = insertProgramBackupSchema.parse({
        ...req.body,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedBy: req.body.createdBy || req.body.uploadedBy || 'Unknown',
        backupSource: 'upload',
        // Generate a simple checksum from file size and name (in production, use proper hashing)
        checksum: `${req.file.size}-${req.file.originalname}`,
      });

      const backup = await storage.createProgramBackup(backupData);
      res.status(201).json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(400).json({ 
        message: "Invalid backup data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/backups/:id", async (req, res) => {
    try {
      const backupData = insertProgramBackupSchema.partial().parse(req.body);
      const backup = await storage.updateProgramBackup(req.params.id, backupData);
      if (!backup) {
        return res.status(404).json({ message: "Backup not found" });
      }
      res.json(backup);
    } catch (error) {
      console.error("Error updating backup:", error);
      res.status(400).json({ message: "Invalid backup data" });
    }
  });

  app.delete("/api/backups/:id", async (req, res) => {
    try {
      const success = await storage.deleteProgramBackup(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Backup not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({ message: "Failed to delete backup" });
    }
  });



  // IPC management
  app.get("/api/ipc-management", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const devices = await storage.getIpcManagement(siteId);
      // Remove actual passwords from response for security
      const safeDevices = devices.map(device => ({
        ...device,
        ipcPassword: device.ipcPassword ? "****" : undefined,
        anydeskPassword: device.anydeskPassword ? "****" : undefined,
      }));
      res.json(safeDevices);
    } catch (error) {
      console.error("Error fetching IPC devices:", error);
      res.status(500).json({ message: "Failed to fetch IPC devices" });
    }
  });

  app.post("/api/ipc-management", async (req, res) => {
    try {
      const deviceData = insertIpcManagementSchema.parse(req.body);
      const device = await storage.createIpcManagement(deviceData);
      // Remove passwords from response
      const safeDevice = { 
        ...device, 
        ipcPassword: device.ipcPassword ? "****" : undefined,
        anydeskPassword: device.anydeskPassword ? "****" : undefined,
      };
      res.status(201).json(safeDevice);
    } catch (error: any) {
      console.error("Error creating IPC device:", error);
      res.status(400).json({ 
        message: "Invalid device data", 
        error: error.flatten ? error.flatten() : error.message 
      });
    }
  });

  app.put("/api/ipc-management/:id", async (req, res) => {
    try {
      const deviceData = insertIpcManagementSchema.partial().parse(req.body);
      const device = await storage.updateIpcManagement(req.params.id, deviceData);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      // Remove passwords from response
      const safeDevice = { 
        ...device, 
        ipcPassword: device.ipcPassword ? "****" : undefined,
        anydeskPassword: device.anydeskPassword ? "****" : undefined,
      };
      res.json(safeDevice);
    } catch (error) {
      console.error("Error updating IPC device:", error);
      res.status(400).json({ message: "Invalid device data" });
    }
  });

  app.delete("/api/ipc-management/:id", async (req, res) => {
    try {
      // Get the IPC device details before deletion to know which IPs to clean up
      const ipcDevices = await storage.getIpcManagement();
      const deviceToDelete = ipcDevices.find(device => device.id === req.params.id);
      
      const success = await storage.deleteIpcManagement(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Clean up any monitoring sites that belong to this IPC device
      if (deviceToDelete) {
        const sitesToCleanup = [];
        const allSites = await storage.getAllSites();
        
        for (const site of allSites) {
          if ((deviceToDelete.vpnIp && site.ipAddress === deviceToDelete.vpnIp) ||
              (deviceToDelete.lanIp && site.ipAddress === deviceToDelete.lanIp)) {
            await storage.deleteSite(site.id);
            sitesToCleanup.push(site.name);
          }
        }
        
        if (sitesToCleanup.length > 0) {
          console.log(`Automatically removed ${sitesToCleanup.length} monitoring sites for deleted IPC device: ${sitesToCleanup.join(', ')}`);
        }
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting IPC device:", error);
      res.status(500).json({ message: "Failed to delete IPC device" });
    }
  });

  // Instrumentation management
  app.get("/api/instrumentation", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const devices = await storage.getInstrumentation(siteId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching instrumentation devices:", error);
      res.status(500).json({ message: "Failed to fetch instrumentation devices" });
    }
  });

  app.post("/api/instrumentation", async (req, res) => {
    try {
      const deviceData = insertInstrumentationSchema.parse(req.body);
      const device = await storage.createInstrumentation(deviceData);
      res.json(device);
    } catch (error) {
      console.error("Error creating instrumentation device:", error);
      res.status(400).json({ message: "Invalid device data" });
    }
  });

  app.put("/api/instrumentation/:id", async (req, res) => {
    try {
      const deviceData = insertInstrumentationSchema.partial().parse(req.body);
      const device = await storage.updateInstrumentation(req.params.id, deviceData);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      console.error("Error updating instrumentation device:", error);
      res.status(400).json({ message: "Invalid device data" });
    }
  });

  app.delete("/api/instrumentation/:id", async (req, res) => {
    try {
      const success = await storage.deleteInstrumentation(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting instrumentation device:", error);
      res.status(500).json({ message: "Failed to delete instrumentation device" });
    }
  });

  app.get("/api/instrumentation/by-type/:deviceType", async (req, res) => {
    try {
      const { deviceType } = req.params;
      const siteId = req.query.siteId as string;
      const devices = await storage.getInstrumentationByType(deviceType, siteId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching instrumentation devices by type:", error);
      res.status(500).json({ message: "Failed to fetch instrumentation devices" });
    }
  });







  // Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const alerts = await storage.getAlerts(limit);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      await storage.markAlertAsRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  app.put("/api/alerts/:id/resolve", async (req, res) => {
    try {
      await storage.markAlertAsResolved(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking alert as resolved:", error);
      res.status(500).json({ message: "Failed to mark alert as resolved" });
    }
  });

  app.get("/api/alerts/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadAlertsCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread alerts count:", error);
      res.status(500).json({ message: "Failed to fetch unread alerts count" });
    }
  });

  // PLC Tags
  app.get("/api/plc-tags", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const tags = await storage.getPlcTags(siteId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching PLC tags:", error);
      res.status(500).json({ message: "Failed to fetch PLC tags" });
    }
  });

  app.get("/api/plc-tags/active", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const tags = await storage.getActivePlcTags(siteId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching active PLC tags:", error);
      res.status(500).json({ message: "Failed to fetch active PLC tags" });
    }
  });

  app.post("/api/plc-tags", async (req, res) => {
    try {
      const result = insertPlcTagSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.errors 
        });
      }

      const tag = await storage.createPlcTag(result.data);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating PLC tag:", error);
      res.status(500).json({ message: "Failed to create PLC tag" });
    }
  });

  app.put("/api/plc-tags/:id", async (req, res) => {
    try {
      const result = insertPlcTagSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.errors 
        });
      }

      const tag = await storage.updatePlcTag(req.params.id, result.data);
      if (!tag) {
        return res.status(404).json({ message: "PLC tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error updating PLC tag:", error);
      res.status(500).json({ message: "Failed to update PLC tag" });
    }
  });

  app.delete("/api/plc-tags/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePlcTag(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "PLC tag not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting PLC tag:", error);
      res.status(500).json({ message: "Failed to delete PLC tag" });
    }
  });

  // Bulk upload PLC tags
  app.post("/api/plc-tags/bulk", async (req, res) => {
    try {
      const { siteId, tags } = req.body;
      
      if (!siteId || !Array.isArray(tags)) {
        return res.status(400).json({ message: "siteId and tags array are required" });
      }

      // Validate each tag before bulk insert
      const validatedTags = [];
      for (const tag of tags) {
        const tagWithDefaults = {
          ...tag,
          isActive: tag.isActive !== undefined ? tag.isActive : true,
          alarmOnTrue: tag.alarmOnTrue !== undefined ? tag.alarmOnTrue : true,
          alarmOnFalse: tag.alarmOnFalse !== undefined ? tag.alarmOnFalse : false,
          severityLevel: tag.severityLevel || 'warning',
          dataType: tag.dataType || 'BOOL'
        };

        const result = insertPlcTagSchema.omit({ siteId: true }).safeParse(tagWithDefaults);
        if (!result.success) {
          return res.status(400).json({ 
            message: "Validation failed for tag: " + tag.tagName, 
            errors: result.error.errors 
          });
        }
        validatedTags.push(result.data);
      }

      const createdTags = await storage.bulkCreatePlcTags(siteId, validatedTags);
      res.status(201).json(createdTags);
    } catch (error) {
      console.error("Error bulk creating PLC tags:", error);
      res.status(500).json({ message: "Failed to bulk create PLC tags" });
    }
  });

  // PLC Tag History
  app.get("/api/plc-tags/:id/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await storage.getPlcTagHistory(req.params.id, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching PLC tag history:", error);
      res.status(500).json({ message: "Failed to fetch PLC tag history" });
    }
  });

  // PLC Tag Value Update (for manual testing)
  app.put("/api/plc-tags/:id/value", async (req, res) => {
    try {
      const { value, createHistory = true } = req.body;
      if (typeof value !== 'string') {
        return res.status(400).json({ message: "Value must be a string" });
      }

      await storage.updatePlcTagValue(req.params.id, value, createHistory);
      res.status(204).send();
    } catch (error) {
      console.error("Error updating PLC tag value:", error);
      res.status(500).json({ message: "Failed to update PLC tag value" });
    }
  });

  // Site Database Tags
  app.get("/api/site-database-tags", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const tags = await storage.getSiteDatabaseTags(siteId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching site database tags:", error);
      res.status(500).json({ message: "Failed to fetch site database tags" });
    }
  });

  app.post("/api/site-database-tags", async (req, res) => {
    try {
      console.log("[API] Received request to create new ADS tag.");
      const tagData = insertSiteDatabaseTagSchema.parse(req.body);
      console.log("[API] Tag data parsed successfully.", tagData);

      // We don't need to validate here, as the monitoring service will log errors if it can't connect.
      // This also simplifies the logic and avoids potential double-reads.

      console.log("[API] Creating tag in database...");
      const tag = await storage.createSiteDatabaseTag(tagData);
      console.log("[API] Tag created successfully in DB:", tag);

      // After creating the tag, start monitoring it immediately if it's active
      if (tag.isActive) {
        console.log(`[API] Tag '${tag.tagName}' is active. Attempting to start monitoring...`);
        try {
          adsMonitoringService.startMonitoringForTag(tag);
          console.log("[API] Call to start monitoring completed.");
        } catch (monitorError) {
          console.error("[API] CRITICAL: Error occurred while trying to start monitoring for the new tag:", monitorError);
          // Even if monitoring fails to start, we should still return the created tag.
          // The error will be logged for debugging.
        }
      }

      console.log("[API] Sending 201 response.");
      // Cleanse the object before sending: Drizzle can return BigInts or other non-serializable types.
      const cleanTag = JSON.parse(JSON.stringify(tag));
      res.status(201).json(cleanTag);
    } catch (error) {
      console.error("[API] CRITICAL: An unexpected error occurred in the create tag route handler:", error);
      // Check if it's a validation error from Zod
      if (error instanceof (await import('zod')).ZodError) {
        return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
      }
      res.status(500).json({ message: "An unexpected error occurred while creating the tag." });
    }
  });

  app.put("/api/site-database-tags/:id", async (req, res) => {
    try {
      const tagData = insertSiteDatabaseTagSchema.partial().parse(req.body);
      const tag = await storage.updateSiteDatabaseTag(req.params.id, tagData);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error updating site database tag:", error);
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.delete("/api/site-database-tags/:id", async (req, res) => {
    try {
      const success = await storage.deleteSiteDatabaseTag(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting site database tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Site Database Values
  app.get("/api/site-database-values/:tagId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const values = await storage.getSiteDatabaseValues(req.params.tagId, limit);
      res.json(values);
    } catch (error) {
      console.error("Error fetching site database values:", error);
      res.status(500).json({ message: "Failed to fetch values" });
    }
  });

  app.post("/api/site-database-values", async (req, res) => {
    try {
      const valueData = insertSiteDatabaseValueSchema.parse(req.body);
      const value = await storage.createSiteDatabaseValue(valueData);
      res.status(201).json(value);
    } catch (error) {
      console.error("Error creating site database value:", error);
      res.status(400).json({ message: "Invalid value data" });
    }
  });

  // Get latest values for all tags in a site
  app.get("/api/sites/:siteId/database-values/latest", async (req, res) => {
    try {
      const values = await storage.getLatestSiteDatabaseValues(req.params.siteId);
      res.json(values);
    } catch (error) {
      console.error("Error fetching latest site database values:", error);
      res.status(500).json({ message: "Failed to fetch latest values" });
    }
  });

  // Real-time MBR Data endpoints
  app.get("/api/mbr-realtime-data", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const data = await storage.getMbrRealtimeData(siteId, limit);
      res.json(data);
    } catch (error) {
      console.error("Error fetching MBR realtime data:", error);
      res.status(500).json({ message: "Failed to fetch MBR realtime data" });
    }
  });

  app.post("/api/mbr-realtime-data", async (req, res) => {
    try {
      const dataToInsert = insertMbrRealtimeDataSchema.parse(req.body);
      const data = await storage.createMbrRealtimeData(dataToInsert);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating MBR realtime data:", error);
      res.status(400).json({ message: "Invalid MBR realtime data" });
    }
  });

  app.get("/api/sites/:id/mbr-realtime-data/latest", async (req, res) => {
    try {
      const data = await storage.getLatestMbrRealtimeData(req.params.id);
      res.json(data);
    } catch (error) {
      console.error("Error fetching latest MBR realtime data:", error);
      res.status(500).json({ message: "Failed to fetch latest MBR realtime data" });
    }
  });

  // Real-time RO Data endpoints
  app.get("/api/ro-realtime-data", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const data = await storage.getRoRealtimeData(siteId, limit);
      res.json(data);
    } catch (error) {
      console.error("Error fetching RO realtime data:", error);
      res.status(500).json({ message: "Failed to fetch RO realtime data" });
    }
  });

  app.post("/api/ro-realtime-data", async (req, res) => {
    try {
      const dataToInsert = insertRoRealtimeDataSchema.parse(req.body);
      const data = await storage.createRoRealtimeData(dataToInsert);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating RO realtime data:", error);
      res.status(400).json({ message: "Invalid RO realtime data" });
    }
  });

  app.get("/api/sites/:id/ro-realtime-data/latest", async (req, res) => {
    try {
      const data = await storage.getLatestRoRealtimeData(req.params.id);
      res.json(data);
    } catch (error) {
      console.error("Error fetching latest RO realtime data:", error);
      res.status(500).json({ message: "Failed to fetch latest RO realtime data" });
    }
  });

  // PLC I/O Calculations endpoints
  app.get("/api/plc-calculations", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const calculations = await storage.getPlcIoCalculations(siteId);
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching PLC calculations:", error);
      res.status(500).json({ message: "Failed to fetch PLC calculations" });
    }
  });

  app.post("/api/plc-calculations", async (req, res) => {
    try {
      const calculationData = insertPlcIoCalculationSchema.parse(req.body);
      const calculation = await storage.createPlcIoCalculation(calculationData);
      res.status(201).json(calculation);
    } catch (error) {
      console.error("Error creating PLC calculation:", error);
      res.status(400).json({ message: "Invalid calculation data" });
    }
  });

  app.patch("/api/plc-calculations/:id", async (req, res) => {
    try {
      const calculation = await storage.updatePlcIoCalculation(req.params.id, req.body);
      if (!calculation) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      console.error("Error updating PLC calculation:", error);
      res.status(500).json({ message: "Failed to update calculation" });
    }
  });

  app.delete("/api/plc-calculations/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePlcIoCalculation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      res.json({ message: "Calculation deleted successfully" });
    } catch (error) {
      console.error("Error deleting PLC calculation:", error);
      res.status(500).json({ message: "Failed to delete calculation" });
    }
  });

  // Panel Configuration Routes
  app.get("/api/panel-configurations", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const panels = await storage.getPanelConfigurations(siteId);
      res.json(panels);
    } catch (error) {
      console.error("Error fetching panel configurations:", error);
      res.status(500).json({ message: "Failed to fetch panel configurations" });
    }
  });

  app.post("/api/panel-configurations", async (req, res) => {
    try {
      const panel = await storage.createPanelConfiguration(req.body);
      res.status(201).json(panel);
    } catch (error) {
      console.error("Error creating panel configuration:", error);
      res.status(400).json({ message: "Invalid panel configuration data" });
    }
  });

  app.patch("/api/panel-configurations/:id", async (req, res) => {
    try {
      const panel = await storage.updatePanelConfiguration(req.params.id, req.body);
      if (!panel) {
        return res.status(404).json({ message: "Panel configuration not found" });
      }
      res.json(panel);
    } catch (error) {
      console.error("Error updating panel configuration:", error);
      res.status(500).json({ message: "Failed to update panel configuration" });
    }
  });

  app.delete("/api/panel-configurations/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePanelConfiguration(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Panel configuration not found" });
      }
      res.json({ message: "Panel configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting panel configuration:", error);
      res.status(500).json({ message: "Failed to delete panel configuration" });
    }
  });

  // Instrument Template Routes
  app.get("/api/instrument-templates", async (req, res) => {
    try {
      const templates = await storage.getInstrumentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching instrument templates:", error);
      res.status(500).json({ message: "Failed to fetch instrument templates" });
    }
  });

  app.post("/api/instrument-templates", async (req, res) => {
    try {
      const template = await storage.createInstrumentTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating instrument template:", error);
      res.status(400).json({ message: "Invalid instrument template data" });
    }
  });

  app.patch("/api/instrument-templates/:id", async (req, res) => {
    try {
      const template = await storage.updateInstrumentTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ message: "Instrument template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating instrument template:", error);
      res.status(500).json({ message: "Failed to update instrument template" });
    }
  });

  app.delete("/api/instrument-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInstrumentTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Instrument template not found" });
      }
      res.json({ message: "Instrument template deleted successfully" });
    } catch (error) {
      console.error("Error deleting instrument template:", error);
      res.status(500).json({ message: "Failed to delete instrument template" });
    }
  });

  // Panel Instrument Routes
  app.get("/api/panel-instruments/:panelId", async (req, res) => {
    try {
      const instruments = await storage.getPanelInstruments(req.params.panelId);
      res.json(instruments);
    } catch (error) {
      console.error("Error fetching panel instruments:", error);
      res.status(500).json({ message: "Failed to fetch panel instruments" });
    }
  });

  app.post("/api/panel-instruments", async (req, res) => {
    try {
      const instrument = await storage.createPanelInstrument(req.body);
      res.status(201).json(instrument);
    } catch (error) {
      console.error("Error creating panel instrument:", error);
      res.status(400).json({ message: "Invalid panel instrument data" });
    }
  });

  app.patch("/api/panel-instruments/:id", async (req, res) => {
    try {
      const instrument = await storage.updatePanelInstrument(req.params.id, req.body);
      if (!instrument) {
        return res.status(404).json({ message: "Panel instrument not found" });
      }
      res.json(instrument);
    } catch (error) {
      console.error("Error updating panel instrument:", error);
      res.status(500).json({ message: "Failed to update panel instrument" });
    }
  });

  app.delete("/api/panel-instruments/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePanelInstrument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Panel instrument not found" });
      }
      res.json({ message: "Panel instrument deleted successfully" });
    } catch (error) {
      console.error("Error deleting panel instrument:", error);
      res.status(500).json({ message: "Failed to delete panel instrument" });
    }
  });

  // Beckhoff Module Calculation Routes
  app.get("/api/beckhoff-calculations", async (req, res) => {
    try {
      const panelId = req.query.panelId as string;
      const calculations = await storage.getBeckhoffModuleCalculations(panelId);
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching Beckhoff calculations:", error);
      res.status(500).json({ message: "Failed to fetch Beckhoff calculations" });
    }
  });

  app.post("/api/beckhoff-calculations", async (req, res) => {
    try {
      const calculation = await storage.createBeckhoffModuleCalculation(req.body);
      res.status(201).json(calculation);
    } catch (error) {
      console.error("Error creating Beckhoff calculation:", error);
      res.status(400).json({ message: "Invalid Beckhoff calculation data" });
    }
  });

  app.patch("/api/beckhoff-calculations/:id", async (req, res) => {
    try {
      const calculation = await storage.updateBeckhoffModuleCalculation(req.params.id, req.body);
      if (!calculation) {
        return res.status(404).json({ message: "Beckhoff calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      console.error("Error updating Beckhoff calculation:", error);
      res.status(500).json({ message: "Failed to update Beckhoff calculation" });
    }
  });

  app.delete("/api/beckhoff-calculations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBeckhoffModuleCalculation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Beckhoff calculation not found" });
      }
      res.json({ message: "Beckhoff calculation deleted successfully" });
    } catch (error) {
      console.error("Error deleting Beckhoff calculation:", error);
      res.status(500).json({ message: "Failed to delete Beckhoff calculation" });
    }
  });

  // Site Events Configuration
  app.get("/api/site-events/configurations", async (req, res) => {
    try {
      const configurations = await storage.getSiteEventConfigurations();
      res.json(configurations);
    } catch (error) {
      console.error("Error fetching site event configurations:", error);
      res.status(500).json({ message: "Failed to fetch site event configurations" });
    }
  });

  app.get("/api/site-events/custom/:databaseName/:tableName", async (req, res) => {
    try {
      const { databaseName, tableName } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const events = await storage.getCustomSiteEvents(databaseName, tableName, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching custom site events:", error);
      res.status(500).json({ message: "Failed to fetch custom site events" });
    }
  });

  // SQL Viewer Endpoints
  app.get("/api/sql-viewer/databases", async (req, res) => {
    try {
      const databases = await sqlViewerService.getDatabases();
      res.json(databases);
    } catch (error) {
      console.error("Error fetching SQL databases:", error);
      res.status(500).json({ message: "Failed to fetch SQL databases" });
    }
  });

  app.get("/api/sql-viewer/databases/:database/tables", async (req, res) => {
    try {
      const tables = await sqlViewerService.getTables(req.params.database);
      res.json(tables);
    } catch (error) {
      console.error(`Error fetching tables for database ${req.params.database}:`, error);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.get("/api/sql-viewer/databases/:database/tables/:table/columns", async (req, res) => {
    try {
      const columns = await sqlViewerService.getTableColumns(req.params.database, req.params.table);
      res.json(columns);
    } catch (error) {
      console.error(`Error fetching columns for table ${req.params.table}:`, error);
      res.status(500).json({ message: "Failed to fetch table columns" });
    }
  });

  app.get("/api/sql-viewer/databases/:database/tables/:table", async (req, res) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        sortColumn: req.query.sortColumn as string,
        sortDirection: req.query.sortDirection as 'asc' | 'desc'
      };
      
      const data = await sqlViewerService.getTableData(req.params.database, req.params.table, options);
      res.json(data);
    } catch (error: any) {
      console.error(`Error fetching data for table ${req.params.table}:`, error);
      
      // Return specific error messages for better user experience
      if (error.message && error.message.includes('not found') || error.message.includes('Invalid column')) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Connection error: Unable to fetch table data. Please check your database connection." });
      }
    }
  });

  // ==========================================
  // AUTOMATION WIZARD ROUTES
  // ==========================================

  // Initialize Beckhoff products catalog on first run
  app.post("/api/automation/init-beckhoff-catalog", async (req, res) => {
    try {
      const sampleProducts = [
        // Main Controllers
        {
          partNumber: "CX2040-0115",
          productName: "Embedded PC CX2040",
          productDescription: "High-performance embedded PC with Intel Atom processor",
          category: "controller",
          subcategory: "main_controller",
          ioCount: 0,
          ioType: "NONE",
          signalType: "N/A",
          communicationProtocol: "EtherCAT",
          powerConsumption: "25.0",
          supplyVoltage: "24VDC",
          unitPrice: "1850.00",
          availabilityStatus: "available",
          leadTime: 14
        },
        // EtherCAT Couplers
        {
          partNumber: "EK1100",
          productName: "EtherCAT Coupler",
          productDescription: "Basic EtherCAT coupler for connecting I/O terminals",
          category: "coupler",
          subcategory: "ethercat_coupler",
          ioCount: 0,
          ioType: "COUPLER",
          signalType: "N/A",
          communicationProtocol: "EtherCAT",
          maxDistance: 100,
          powerConsumption: "1.5",
          supplyVoltage: "24VDC",
          unitPrice: "145.00",
          availabilityStatus: "available",
          leadTime: 7
        },
        {
          partNumber: "EK1122",
          productName: "EtherCAT Coupler with ID switch",
          productDescription: "EtherCAT coupler with integrated ID switch",
          category: "coupler",
          subcategory: "ethercat_coupler",
          ioCount: 0,
          ioType: "COUPLER",
          signalType: "N/A",
          communicationProtocol: "EtherCAT",
          maxDistance: 100,
          powerConsumption: "1.8",
          supplyVoltage: "24VDC",
          unitPrice: "195.00",
          availabilityStatus: "available",
          leadTime: 7
        },
        // Digital Input Modules
        {
          partNumber: "EL1008",
          productName: "8-channel digital input",
          productDescription: "8-channel digital input terminal 24V DC",
          category: "digital_io",
          subcategory: "di_module",
          ioCount: 8,
          ioType: "DI",
          signalType: "24VDC",
          powerConsumption: "2.0",
          supplyVoltage: "24VDC",
          unitPrice: "45.00",
          availabilityStatus: "available",
          leadTime: 5
        },
        {
          partNumber: "EL1018",
          productName: "8-channel digital input",
          productDescription: "8-channel digital input terminal 24V DC, filter 10µs",
          category: "digital_io",
          subcategory: "di_module",
          ioCount: 8,
          ioType: "DI",
          signalType: "24VDC",
          powerConsumption: "2.0",
          supplyVoltage: "24VDC",
          unitPrice: "52.00",
          availabilityStatus: "available",
          leadTime: 5
        },
        // Digital Output Modules
        {
          partNumber: "EL2008",
          productName: "8-channel digital output",
          productDescription: "8-channel digital output terminal 24V DC, 0.5A",
          category: "digital_io",
          subcategory: "do_module",
          ioCount: 8,
          ioType: "DO",
          signalType: "24VDC",
          maxCurrent: 500,
          powerConsumption: "2.5",
          supplyVoltage: "24VDC",
          unitPrice: "55.00",
          availabilityStatus: "available",
          leadTime: 5
        },
        {
          partNumber: "EL2004",
          productName: "4-channel digital output",
          productDescription: "4-channel digital output terminal 24V DC, 2A",
          category: "digital_io",
          subcategory: "do_module",
          ioCount: 4,
          ioType: "DO",
          signalType: "24VDC",
          maxCurrent: 2000,
          powerConsumption: "3.0",
          supplyVoltage: "24VDC",
          unitPrice: "65.00",
          availabilityStatus: "available",
          leadTime: 5
        },
        // Analog Input Modules
        {
          partNumber: "EL3004",
          productName: "4-channel analog input",
          productDescription: "4-channel analog input terminal 4-20mA, single-ended, 12-bit",
          category: "analog_io",
          subcategory: "ai_module",
          ioCount: 4,
          ioType: "AI",
          signalType: "4-20mA",
          resolution: 12,
          powerConsumption: "2.0",
          supplyVoltage: "24VDC",
          unitPrice: "145.00",
          availabilityStatus: "available",
          leadTime: 7
        },
        {
          partNumber: "EL3008",
          productName: "8-channel analog input",
          productDescription: "8-channel analog input terminal 4-20mA, single-ended, 12-bit",
          category: "analog_io",
          subcategory: "ai_module",
          ioCount: 8,
          ioType: "AI",
          signalType: "4-20mA",
          resolution: 12,
          powerConsumption: "2.5",
          supplyVoltage: "24VDC",
          unitPrice: "195.00",
          availabilityStatus: "available",
          leadTime: 7
        },
        // Analog Output Modules
        {
          partNumber: "EL4004",
          productName: "4-channel analog output",
          productDescription: "4-channel analog output terminal 4-20mA, 12-bit",
          category: "analog_io",
          subcategory: "ao_module",
          ioCount: 4,
          ioType: "AO",
          signalType: "4-20mA",
          resolution: 12,
          powerConsumption: "3.0",
          supplyVoltage: "24VDC",
          unitPrice: "165.00",
          availabilityStatus: "available",
          leadTime: 7
        },
        // Communication Modules
        {
          partNumber: "EL6001",
          productName: "Serial interface RS232",
          productDescription: "1-channel serial interface RS232",
          category: "communication",
          subcategory: "serial_interface",
          ioCount: 1,
          ioType: "COMM",
          signalType: "RS232",
          communicationProtocol: "RS232",
          dataRate: "115200 baud",
          powerConsumption: "1.5",
          supplyVoltage: "24VDC",
          unitPrice: "125.00",
          availabilityStatus: "available",
          leadTime: 10
        },
        {
          partNumber: "EL6021",
          productName: "Serial interface RS422/RS485",
          productDescription: "1-channel serial interface RS422/RS485",
          category: "communication",
          subcategory: "serial_interface",
          ioCount: 1,
          ioType: "COMM",
          signalType: "RS485",
          communicationProtocol: "RS485",
          dataRate: "115200 baud",
          powerConsumption: "1.8",
          supplyVoltage: "24VDC",
          unitPrice: "145.00",
          availabilityStatus: "available",
          leadTime: 10
        },
        // Power Supply Modules
        {
          partNumber: "EL9011",
          productName: "Power supply terminal",
          productDescription: "Power supply terminal for E-bus 24V DC",
          category: "power",
          subcategory: "power_supply",
          ioCount: 0,
          ioType: "POWER",
          signalType: "24VDC",
          powerConsumption: "0",
          supplyVoltage: "24VDC",
          unitPrice: "35.00",
          availabilityStatus: "available",
          leadTime: 3
        },
        {
          partNumber: "EL9012",
          productName: "Power supply terminal with diagnostics",
          productDescription: "Power supply terminal for E-bus 24V DC with diagnostics",
          category: "power",
          subcategory: "power_supply",
          ioCount: 0,
          ioType: "POWER",
          signalType: "24VDC",
          powerConsumption: "0",
          supplyVoltage: "24VDC",
          unitPrice: "55.00",
          availabilityStatus: "available",
          leadTime: 3
        }
      ];

      // Check if products already exist
      const existingProducts = await storage.getAllBeckhoffProducts();
      if (existingProducts.length > 0) {
        return res.json({ message: "Beckhoff catalog already initialized", count: existingProducts.length });
      }

      // Insert sample products
      const results = [];
      for (const product of sampleProducts) {
        const productData = insertBeckhoffProductSchema.parse(product);
        const created = await storage.createBeckhoffProduct(productData);
        results.push(created);
      }

      res.json({ message: "Beckhoff catalog initialized successfully", count: results.length, products: results });
    } catch (error) {
      console.error("Error initializing Beckhoff catalog:", error);
      res.status(500).json({ message: "Failed to initialize Beckhoff catalog" });
    }
  });

  // Initialize Automation Vendors and Products
  app.post("/api/automation/init-vendors-catalog", async (req, res) => {
    try {
      // Check if vendors already exist
      const existingVendors = await storage.getAllAutomationVendors();
      if (existingVendors.length > 0) {
        return res.json({ message: "Vendors catalog already initialized", count: existingVendors.length });
      }

      // Define sample vendors
      const sampleVendors = [
        {
          vendorName: "BECKHOFF",
          vendorDisplayName: "Beckhoff Automation",
          vendorDescription: "German automation company specializing in PC-based control technology and EtherCAT",
          website: "https://www.beckhoff.com",
          supportEmail: "support@beckhoff.com",
          logoUrl: "/vendor-logos/beckhoff.png",
          country: "Germany",
          isPreferred: true
        },
        {
          vendorName: "SIEMENS", 
          vendorDisplayName: "Siemens",
          vendorDescription: "Global industrial automation and digitalization leader with comprehensive portfolio",
          website: "https://www.siemens.com",
          supportEmail: "support@siemens.com",
          logoUrl: "/vendor-logos/siemens.png",
          country: "Germany",
          isPreferred: true
        },
        {
          vendorName: "ROCKWELL",
          vendorDisplayName: "Rockwell Automation (Allen-Bradley)",
          vendorDescription: "Leading provider of industrial automation and information solutions", 
          website: "https://www.rockwellautomation.com",
          supportEmail: "support@rockwellautomation.com",
          logoUrl: "/vendor-logos/rockwell.png",
          country: "USA",
          isPreferred: true
        },
        {
          vendorName: "SCHNEIDER",
          vendorDisplayName: "Schneider Electric",
          vendorDescription: "Global specialist in energy management and automation solutions",
          website: "https://www.schneider-electric.com",
          supportEmail: "support@schneider-electric.com",
          logoUrl: "/vendor-logos/schneider.png",
          country: "France",
          isPreferred: true
        },
        {
          vendorName: "ABB",
          vendorDisplayName: "ABB",
          vendorDescription: "Technology leader in electrification and automation solutions",
          website: "https://www.abb.com",
          supportEmail: "support@abb.com",
          logoUrl: "/vendor-logos/abb.png",
          country: "Switzerland",
          isPreferred: false
        },
        {
          vendorName: "MITSUBISHI",
          vendorDisplayName: "Mitsubishi Electric",
          vendorDescription: "Japanese multinational with comprehensive automation and control solutions",
          website: "https://www.mitsubishielectric.com",
          supportEmail: "support@mitsubishi.com",
          logoUrl: "/vendor-logos/mitsubishi.png",
          country: "Japan",
          isPreferred: false
        }
      ];

      // Insert sample vendors
      const vendorResults = [];
      const vendorMap = new Map();
      
      for (const vendor of sampleVendors) {
        console.log("Processing vendor:", JSON.stringify(vendor, null, 2));
        const vendorData = insertAutomationVendorSchema.parse(vendor);
        const created = await storage.createAutomationVendor(vendorData);
        vendorResults.push(created);
        vendorMap.set(created.vendorName, created.id);
      }

      // Define sample products for each vendor
      const sampleProducts = [
        // Beckhoff Products
        {
          vendorId: vendorMap.get("BECKHOFF"),
          partNumber: "CX5130",
          productName: "CX5130",
          productDisplayName: "CX5130 Embedded PC",
          productDescription: "Compact embedded PC with Intel Atom processor, perfect for small to medium automation tasks",
          category: "controller",
          subcategory: "embedded_pc",
          productFamily: "CX Series",
          ioType: "CONTROLLER",
          ioCount: 0,
          technicalSpecs: {
            processor: "Intel Atom E3825",
            memory: "2 GB DDR3L",
            storage: "16 GB CFast",
            interfaces: ["2x Ethernet", "4x USB 2.0", "2x RS232"]
          },
          unitPrice: "650.00",
          currency: "USD",
          isRecommended: true,
          isFeatured: true
        },
        {
          vendorId: vendorMap.get("BECKHOFF"),
          partNumber: "EL1008",
          productName: "EL1008",
          productDisplayName: "8-Channel Digital Input 24V",
          productDescription: "Reliable 8-channel digital input terminal for 24V DC signals with LED status indicators",
          category: "digital_io",
          subcategory: "digital_input",
          productFamily: "EtherCAT Terminals",
          ioType: "DI",
          ioCount: 8,
          signalType: "24VDC",
          technicalSpecs: {
            channels: "8 x 24V DC",
            inputFilter: "3.0 ms",
            connection: "Push-in terminals"
          },
          unitPrice: "45.00",
          currency: "USD",
          isRecommended: true
        },
        {
          vendorId: vendorMap.get("BECKHOFF"),
          partNumber: "EL2008",
          productName: "EL2008",
          productDisplayName: "8-Channel Digital Output 24V",
          productDescription: "High-performance 8-channel digital output terminal for switching 24V DC loads up to 0.5A per channel",
          category: "digital_io",
          subcategory: "digital_output",
          productFamily: "EtherCAT Terminals",
          ioType: "DO",
          ioCount: 8,
          signalType: "24VDC",
          technicalSpecs: {
            channels: "8 x 24V DC, 0.5A",
            shortCircuitProtection: true,
            connection: "Push-in terminals"
          },
          unitPrice: "55.00",
          currency: "USD",
          isRecommended: true
        },
        // Siemens Products
        {
          vendorId: vendorMap.get("SIEMENS"),
          partNumber: "6ES7516-3AN02-0AB0",
          productName: "6ES7516-3AN02-0AB0",
          productDisplayName: "SIMATIC S7-1500 CPU 1516-3 PN/DP",
          productDescription: "High-performance CPU with integrated PROFINET interface for demanding automation tasks",
          category: "controller",
          subcategory: "main_controller",
          productFamily: "SIMATIC S7-1500",
          ioType: "CONTROLLER",
          ioCount: 0,
          technicalSpecs: {
            workMemory: "1 MB",
            loadMemory: "8 MB",
            interfaces: ["PROFINET", "PROFIBUS DP"],
            execution: "High-speed processing"
          },
          unitPrice: "1850.00",
          currency: "USD",
          isRecommended: true,
          isFeatured: true
        },
        {
          vendorId: vendorMap.get("SIEMENS"),
          partNumber: "6ES7134-6HD00-0BA1",
          productName: "6ES7134-6HD00-0BA1",
          productDisplayName: "ET 200SP 8DI x 24V DC Standard",
          productDescription: "Compact 8-channel digital input module for 24V DC sensors with high channel density",
          category: "digital_io",
          subcategory: "digital_input",
          productFamily: "SIMATIC ET 200SP",
          ioType: "DI",
          ioCount: 8,
          signalType: "24VDC",
          technicalSpecs: {
            channels: "8 x 24V DC",
            inputDelay: "3.2 ms",
            connection: "Push-in terminals"
          },
          unitPrice: "85.00",
          currency: "USD",
          isRecommended: true
        },
        // Rockwell Products
        {
          vendorId: vendorMap.get("ROCKWELL"),
          partNumber: "1756-L85E",
          productName: "1756-L85E",
          productDisplayName: "ControlLogix 5580 Controller",
          productDescription: "High-performance controller with integrated Ethernet/IP for large-scale automation systems",
          category: "controller",
          subcategory: "main_controller",
          productFamily: "ControlLogix 5580",
          ioType: "CONTROLLER",
          ioCount: 0,
          technicalSpecs: {
            memory: "5 MB user memory",
            interfaces: ["Dual Ethernet/IP"],
            scanTime: "Sub-millisecond"
          },
          unitPrice: "4200.00",
          currency: "USD",
          isRecommended: true,
          isFeatured: true
        },
        {
          vendorId: vendorMap.get("ROCKWELL"),
          partNumber: "1734-IB8",
          productName: "1734-IB8",
          productDisplayName: "POINT I/O 8-Point DC Input",
          productDescription: "Flexible 8-point 24V DC input module with removable terminal blocks",
          category: "digital_io", 
          subcategory: "digital_input",
          productFamily: "POINT I/O",
          ioType: "DI",
          ioCount: 8,
          signalType: "24VDC",
          technicalSpecs: {
            channels: "8 x 24V DC",
            inputFilter: "Programmable",
            connection: "Removable terminal blocks"
          },
          unitPrice: "125.00",
          currency: "USD",
          isRecommended: true
        },
        // Schneider Electric Products  
        {
          vendorId: vendorMap.get("SCHNEIDER"),
          partNumber: "BMXP582040",
          productName: "BMXP582040",
          productDisplayName: "Modicon M580 CPU",
          productDescription: "High-end CPU with dual Ethernet ports for critical process applications",
          category: "controller",
          subcategory: "main_controller", 
          productFamily: "Modicon M580",
          ioType: "CONTROLLER",
          ioCount: 0,
          technicalSpecs: {
            memory: "32 MB RAM",
            interfaces: ["Dual Ethernet", "Modbus TCP"],
            safety: "SIL 3 certified"
          },
          unitPrice: "2800.00",
          currency: "USD",
          isRecommended: true
        }
      ];

      // Insert sample products
      const productResults = [];
      for (const product of sampleProducts) {
        const productData = insertAutomationProductSchema.parse(product);
        const created = await storage.createAutomationProduct(productData);
        productResults.push(created);
      }

      res.json({ 
        message: "Automation vendors and products catalog initialized successfully", 
        vendors: vendorResults.length, 
        products: productResults.length,
        vendorNames: vendorResults.map(v => v.vendorDisplayName)
      });
    } catch (error) {
      console.error("Error initializing automation catalog:", error);
      res.status(500).json({ message: "Failed to initialize automation catalog" });
    }
  });

  // Automation Projects endpoints
  app.get("/api/automation-projects", async (req, res) => {
    try {
      const projects = await storage.getAllAutomationProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching automation projects:", error);
      res.status(500).json({ message: "Failed to fetch automation projects" });
    }
  });

  app.get("/api/automation-projects/:id", async (req, res) => {
    try {
      const project = await storage.getAutomationProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Automation project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching automation project:", error);
      res.status(500).json({ message: "Failed to fetch automation project" });
    }
  });

  app.post("/api/automation-projects", async (req, res) => {
    try {
      const projectData = insertAutomationProjectSchema.parse(req.body);
      const project = await storage.createAutomationProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating automation project:", error);
      res.status(400).json({ message: "Invalid automation project data" });
    }
  });

  app.put("/api/automation-projects/:id", async (req, res) => {
    try {
      const projectData = insertAutomationProjectSchema.partial().parse(req.body);
      const project = await storage.updateAutomationProject(req.params.id, projectData);
      if (!project) {
        return res.status(404).json({ message: "Automation project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating automation project:", error);
      res.status(400).json({ message: "Invalid automation project data" });
    }
  });

  // Beckhoff Products endpoints
  app.get("/api/beckhoff-products", async (req, res) => {
    try {
      const { category, subcategory, ioType } = req.query;
      const products = await storage.getBeckhoffProducts({
        category: category as string,
        subcategory: subcategory as string,
        ioType: ioType as string
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching Beckhoff products:", error);
      res.status(500).json({ message: "Failed to fetch Beckhoff products" });
    }
  });

  app.get("/api/beckhoff-products/:id", async (req, res) => {
    try {
      const product = await storage.getBeckhoffProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Beckhoff product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching Beckhoff product:", error);
      res.status(500).json({ message: "Failed to fetch Beckhoff product" });
    }
  });

  // Automation Vendors endpoints
  app.get("/api/automation-vendors", async (req, res) => {
    try {
      const vendors = await storage.getAllAutomationVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching automation vendors:", error);
      res.status(500).json({ message: "Failed to fetch automation vendors" });
    }
  });

  app.get("/api/automation-vendors/:id", async (req, res) => {
    try {
      const vendor = await storage.getAutomationVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Automation vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching automation vendor:", error);
      res.status(500).json({ message: "Failed to fetch automation vendor" });
    }
  });

  app.post("/api/automation-vendors", async (req, res) => {
    try {
      const vendorData = insertAutomationVendorSchema.parse(req.body);
      const vendor = await storage.createAutomationVendor(vendorData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating automation vendor:", error);
      res.status(400).json({ message: "Invalid automation vendor data" });
    }
  });

  app.put("/api/automation-vendors/:id", async (req, res) => {
    try {
      const vendorData = insertAutomationVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateAutomationVendor(req.params.id, vendorData);
      if (!vendor) {
        return res.status(404).json({ message: "Automation vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error updating automation vendor:", error);
      res.status(400).json({ message: "Invalid automation vendor data" });
    }
  });

  // Automation Products endpoints
  app.get("/api/automation-products", async (req, res) => {
    try {
      const { vendorId, category, subcategory, ioType, productFamily } = req.query;
      const products = await storage.getAutomationProducts({
        vendorId: vendorId as string,
        category: category as string,
        subcategory: subcategory as string,
        ioType: ioType as string,
        productFamily: productFamily as string
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching automation products:", error);
      res.status(500).json({ message: "Failed to fetch automation products" });
    }
  });

  app.get("/api/automation-products/:id", async (req, res) => {
    try {
      const product = await storage.getAutomationProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Automation product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching automation product:", error);
      res.status(500).json({ message: "Failed to fetch automation product" });
    }
  });

  app.post("/api/automation-products", async (req, res) => {
    try {
      const productData = insertAutomationProductSchema.parse(req.body);
      const product = await storage.createAutomationProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating automation product:", error);
      res.status(400).json({ message: "Invalid automation product data" });
    }
  });

  app.put("/api/automation-products/:id", async (req, res) => {
    try {
      const productData = insertAutomationProductSchema.partial().parse(req.body);
      const product = await storage.updateAutomationProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Automation product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating automation product:", error);
      res.status(400).json({ message: "Invalid automation product data" });
    }
  });

  // Automation Panels endpoints
  app.get("/api/automation-panels", async (req, res) => {
    try {
      const { projectId } = req.query;
      const panels = await storage.getAutomationPanels(projectId as string);
      res.json(panels);
    } catch (error) {
      console.error("Error fetching automation panels:", error);
      res.status(500).json({ message: "Failed to fetch automation panels" });
    }
  });

  app.post("/api/automation-panels", async (req, res) => {
    try {
      const panelData = insertAutomationPanelSchema.parse(req.body);
      const panel = await storage.createAutomationPanel(panelData);
      res.status(201).json(panel);
    } catch (error) {
      console.error("Error creating automation panel:", error);
      res.status(400).json({ message: "Invalid automation panel data" });
    }
  });

  // Device Templates endpoints
  app.get("/api/automation-device-templates", async (req, res) => {
    try {
      const { deviceType, category } = req.query;
      const templates = await storage.getAutomationDeviceTemplates({
        deviceType: deviceType as string,
        category: category as string
      });
      res.json(templates);
    } catch (error) {
      console.error("Error fetching device templates:", error);
      res.status(500).json({ message: "Failed to fetch device templates" });
    }
  });

  app.post("/api/automation-device-templates", async (req, res) => {
    try {
      const templateData = insertAutomationDeviceTemplateSchema.parse(req.body);
      const template = await storage.createAutomationDeviceTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating device template:", error);
      res.status(400).json({ message: "Invalid device template data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

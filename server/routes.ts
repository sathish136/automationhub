import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pingService } from "./services/pingService";
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
  insertSiteDatabaseValueSchema
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Start ping monitoring service
  pingService.startMonitoring();

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

  // Program backups
  app.get("/api/backups", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const backups = await storage.getProgramBackups(siteId);
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

      const backupData = insertProgramBackupSchema.parse({
        ...req.body,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
      });

      const backup = await storage.createProgramBackup(backupData);
      res.status(201).json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
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
    } catch (error) {
      console.error("Error creating IPC device:", error);
      res.status(400).json({ message: "Invalid device data" });
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

  // VFD parameters
  app.get("/api/vfd-parameters", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const parameters = await storage.getVfdParameters(siteId);
      res.json(parameters);
    } catch (error) {
      console.error("Error fetching VFD parameters:", error);
      res.status(500).json({ message: "Failed to fetch VFD parameters" });
    }
  });

  app.post("/api/vfd-parameters", async (req, res) => {
    try {
      const parameterData = insertVfdParameterSchema.parse(req.body);
      const parameter = await storage.createVfdParameter(parameterData);
      res.status(201).json(parameter);
    } catch (error) {
      console.error("Error creating VFD parameter:", error);
      res.status(400).json({ message: "Invalid parameter data" });
    }
  });

  app.put("/api/vfd-parameters/:id", async (req, res) => {
    try {
      const parameterData = insertVfdParameterSchema.partial().parse(req.body);
      const parameter = await storage.updateVfdParameter(req.params.id, parameterData);
      if (!parameter) {
        return res.status(404).json({ message: "Parameter not found" });
      }
      res.json(parameter);
    } catch (error) {
      console.error("Error updating VFD parameter:", error);
      res.status(400).json({ message: "Invalid parameter data" });
    }
  });

  app.delete("/api/vfd-parameters/:id", async (req, res) => {
    try {
      const success = await storage.deleteVfdParameter(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Parameter not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting VFD parameter:", error);
      res.status(500).json({ message: "Failed to delete VFD parameter" });
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
      const tagData = insertSiteDatabaseTagSchema.parse(req.body);
      const tag = await storage.createSiteDatabaseTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating site database tag:", error);
      res.status(400).json({ message: "Invalid tag data" });
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

  const httpServer = createServer(app);
  return httpServer;
}

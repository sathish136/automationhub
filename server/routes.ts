import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pingService } from "./services/pingService";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { 
  insertSiteSchema, 
  insertNetworkEquipmentSchema, 
  insertIpcManagementSchema, 
  insertVfdParameterSchema, 
  insertProgramBackupSchema,
  insertCommunicationInterfaceSchema,
  insertInstrumentDataSchema,
  insertCommunicationLogSchema,
  insertProjectSchema
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
      const projectData = insertProjectSchema.parse(req.body);
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

  // Network equipment
  app.get("/api/network-equipment", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const equipment = await storage.getNetworkEquipment(siteId);
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching network equipment:", error);
      res.status(500).json({ message: "Failed to fetch network equipment" });
    }
  });

  app.post("/api/network-equipment", async (req, res) => {
    try {
      const equipmentData = insertNetworkEquipmentSchema.parse(req.body);
      const equipment = await storage.createNetworkEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      console.error("Error creating network equipment:", error);
      res.status(400).json({ message: "Invalid equipment data" });
    }
  });

  app.put("/api/network-equipment/:id", async (req, res) => {
    try {
      const equipmentData = insertNetworkEquipmentSchema.partial().parse(req.body);
      const equipment = await storage.updateNetworkEquipment(req.params.id, equipmentData);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      console.error("Error updating network equipment:", error);
      res.status(400).json({ message: "Invalid equipment data" });
    }
  });

  app.delete("/api/network-equipment/:id", async (req, res) => {
    try {
      const success = await storage.deleteNetworkEquipment(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting network equipment:", error);
      res.status(500).json({ message: "Failed to delete network equipment" });
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

  // Communication Interfaces
  app.get("/api/communication-interfaces", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const interfaces = await storage.getCommunicationInterfaces(siteId);
      res.json(interfaces);
    } catch (error) {
      console.error("Error fetching communication interfaces:", error);
      res.status(500).json({ message: "Failed to fetch communication interfaces" });
    }
  });

  app.post("/api/communication-interfaces", async (req, res) => {
    try {
      const interfaceData = insertCommunicationInterfaceSchema.parse(req.body);
      const commInterface = await storage.createCommunicationInterface(interfaceData);
      res.status(201).json(commInterface);
    } catch (error) {
      console.error("Error creating communication interface:", error);
      res.status(400).json({ message: "Invalid interface data" });
    }
  });

  app.put("/api/communication-interfaces/:id", async (req, res) => {
    try {
      const interfaceData = insertCommunicationInterfaceSchema.partial().parse(req.body);
      const commInterface = await storage.updateCommunicationInterface(req.params.id, interfaceData);
      if (!commInterface) {
        return res.status(404).json({ message: "Interface not found" });
      }
      res.json(commInterface);
    } catch (error) {
      console.error("Error updating communication interface:", error);
      res.status(400).json({ message: "Invalid interface data" });
    }
  });

  app.delete("/api/communication-interfaces/:id", async (req, res) => {
    try {
      const success = await storage.deleteCommunicationInterface(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Interface not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting communication interface:", error);
      res.status(500).json({ message: "Failed to delete communication interface" });
    }
  });

  // Instrument Data
  app.get("/api/communication-interfaces/:id/instruments", async (req, res) => {
    try {
      const instruments = await storage.getInstrumentData(req.params.id);
      res.json(instruments);
    } catch (error) {
      console.error("Error fetching instrument data:", error);
      res.status(500).json({ message: "Failed to fetch instrument data" });
    }
  });

  app.post("/api/communication-interfaces/:id/instruments", async (req, res) => {
    try {
      const instrumentData = insertInstrumentDataSchema.parse({
        ...req.body,
        commInterfaceId: req.params.id,
      });
      const instrument = await storage.createInstrumentData(instrumentData);
      res.status(201).json(instrument);
    } catch (error) {
      console.error("Error creating instrument data:", error);
      res.status(400).json({ message: "Invalid instrument data" });
    }
  });

  app.put("/api/instruments/:id", async (req, res) => {
    try {
      const instrumentData = insertInstrumentDataSchema.partial().parse(req.body);
      const instrument = await storage.updateInstrumentData(req.params.id, instrumentData);
      if (!instrument) {
        return res.status(404).json({ message: "Instrument not found" });
      }
      res.json(instrument);
    } catch (error) {
      console.error("Error updating instrument data:", error);
      res.status(400).json({ message: "Invalid instrument data" });
    }
  });

  app.delete("/api/instruments/:id", async (req, res) => {
    try {
      const success = await storage.deleteInstrumentData(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Instrument not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting instrument data:", error);
      res.status(500).json({ message: "Failed to delete instrument data" });
    }
  });

  // Communication Logs
  app.get("/api/communication-interfaces/:id/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getCommunicationLogs(req.params.id, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching communication logs:", error);
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.post("/api/communication-interfaces/:id/logs", async (req, res) => {
    try {
      const logData = insertCommunicationLogSchema.parse({
        ...req.body,
        commInterfaceId: req.params.id,
      });
      const log = await storage.createCommunicationLog(logData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating communication log:", error);
      res.status(400).json({ message: "Invalid log data" });
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

  const httpServer = createServer(app);
  return httpServer;
}

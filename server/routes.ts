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
  insertIpcCredentialSchema, 
  insertVfdParameterSchema, 
  insertProgramBackupSchema,
  insertCommunicationInterfaceSchema,
  insertInstrumentDataSchema,
  insertCommunicationLogSchema
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

  // IPC credentials
  app.get("/api/ipc-credentials", async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const credentials = await storage.getIpcCredentials(siteId);
      // Remove actual passwords from response for security
      const safeCredentials = credentials.map(cred => ({
        ...cred,
        password: "****",
      }));
      res.json(safeCredentials);
    } catch (error) {
      console.error("Error fetching IPC credentials:", error);
      res.status(500).json({ message: "Failed to fetch IPC credentials" });
    }
  });

  app.post("/api/ipc-credentials", async (req, res) => {
    try {
      const credentialData = insertIpcCredentialSchema.parse(req.body);
      const credential = await storage.createIpcCredential(credentialData);
      // Remove password from response
      const safeCredential = { ...credential, password: "****" };
      res.status(201).json(safeCredential);
    } catch (error) {
      console.error("Error creating IPC credential:", error);
      res.status(400).json({ message: "Invalid credential data" });
    }
  });

  app.put("/api/ipc-credentials/:id", async (req, res) => {
    try {
      const credentialData = insertIpcCredentialSchema.partial().parse(req.body);
      const credential = await storage.updateIpcCredential(req.params.id, credentialData);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      // Remove password from response
      const safeCredential = { ...credential, password: "****" };
      res.json(safeCredential);
    } catch (error) {
      console.error("Error updating IPC credential:", error);
      res.status(400).json({ message: "Invalid credential data" });
    }
  });

  app.delete("/api/ipc-credentials/:id", async (req, res) => {
    try {
      const success = await storage.deleteIpcCredential(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting IPC credential:", error);
      res.status(500).json({ message: "Failed to delete IPC credential" });
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

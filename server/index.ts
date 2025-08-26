import "./env"; // Load environment variables first

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { adsMonitoringService } from "./services/adsMonitoringService";
import { storage } from "./storage";
import { sqlViewerService } from "./services/sqlViewerService";
import { pingService } from "./services/pingService";
import "./services/maintenanceService"; // Start automated maintenance monitoring

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test ADS Connection
app.post('/api/test-ads-connection', async (req, res) => {
  const { siteId, tagId } = req.body;
  if (!siteId || !tagId) {
    return res.status(400).json({ message: 'siteId and tagId are required' });
  }
  try {
    // We need to fetch the full site and tag objects to pass to the service
    const site = await storage.getSite(siteId);
    const tag = await storage.getSiteDatabaseTag(tagId);

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    const result = await adsMonitoringService.testADSConnection(site, tag);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`[API] Error testing ADS connection for site ${siteId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

(async () => {
  // Register all API routes and create the HTTP server
  const httpServer = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Setup Vite for development or serve static files for production
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Define the port
  const port = parseInt(process.env.PORT || '5000', 10);

  // Start the server and initialize services
  httpServer.listen(port, async () => {
    log(`Server listening on http://localhost:${port}`);

    // Test SQL Viewer Connection
    try {
      await sqlViewerService.testConnection();
    } catch (error) {
      console.error("[FATAL] Could not connect to the external SQL Server. The SQL Viewer will not be available.");
    }

    // Initialize and start monitoring services
    try {
      const allSites = await storage.getAllSites();
      const allTags = await storage.getSiteDatabaseTags();
      console.log(`[INIT] Fetched ${allSites.length} sites and ${allTags.length} tags for monitoring.`);
      adsMonitoringService.startMonitoringAllSites(allSites, allTags);
    } catch (error) {
      console.error("Failed to fetch initial data for monitoring:", error);
      process.exit(1); // Exit if we can't get monitoring data
    }

    pingService.startMonitoring();
  });
})();

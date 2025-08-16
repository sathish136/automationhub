import { storage } from "../storage";

interface ADSConnection {
  siteId: string;
  targetHost: string;
  amsNetId: string;
  isConnected: boolean;
  lastConnectionAttempt?: Date;
  lastSuccessfulRead?: Date;
}

class ADSMonitoringService {
  private connections: Map<string, ADSConnection> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log("ADS monitoring is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting ADS monitoring service...");

    // Load active sites and their tags
    await this.initializeConnections();
    
    // Start monitoring for each site
    this.startSiteMonitoring();
  }

  async stopMonitoring(): Promise<void> {
    console.log("Stopping ADS monitoring service...");
    this.isRunning = false;

    // Clear all monitoring intervals
    this.monitoringIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();

    // Close all connections
    this.connections.clear();
  }

  private async initializeConnections(): Promise<void> {
    try {
      // Get all active sites
      const sites = await storage.getAllSites();
      
      for (const site of sites) {
        // Get site's IPC management info for ADS connection
        const ipcDevices = await storage.getIpcManagement(site.id);
        
        if (ipcDevices.length > 0) {
          const ipc = ipcDevices[0]; // Use first IPC device
          
          this.connections.set(site.id, {
            siteId: site.id,
            targetHost: site.ipAddress,
            amsNetId: ipc.amsNetId || "127.0.0.1.1.1:851",
            isConnected: false,
          });
        }
      }
      
      console.log(`Initialized ${this.connections.size} ADS connections`);
    } catch (error) {
      console.error("Error initializing ADS connections:", error);
    }
  }

  private startSiteMonitoring(): void {
    this.connections.forEach((connection, siteId) => {
      this.startSiteTagMonitoring(siteId);
    });
  }

  private async startSiteTagMonitoring(siteId: string): Promise<void> {
    try {
      // Get all active tags for this site
      const tags = await storage.getSiteDatabaseTags(siteId);
      const activeTags = tags.filter(tag => tag.isActive);

      if (activeTags.length === 0) {
        console.log(`No active tags found for site ${siteId}`);
        return;
      }

      console.log(`Starting monitoring for ${activeTags.length} tags on site ${siteId}`);

      // Create monitoring interval - default 2 seconds, but respect individual tag settings
      const defaultInterval = 2000;
      
      const interval = setInterval(async () => {
        if (!this.isRunning) return;
        
        await this.readSiteTags(siteId, activeTags);
      }, defaultInterval);

      this.monitoringIntervals.set(siteId, interval);
    } catch (error) {
      console.error(`Error starting tag monitoring for site ${siteId}:`, error);
    }
  }

  private async readSiteTags(siteId: string, tags: any[]): Promise<void> {
    const connection = this.connections.get(siteId);
    if (!connection) return;

    try {
      // Simulate ADS read operation
      // In a real implementation, this would use the node-ads library
      for (const tag of tags) {
        try {
          const value = await this.simulateADSRead(connection, tag);
          
          // Store the value in database
          await storage.createSiteDatabaseValue({
            tagId: tag.id,
            value: value.toString(),
            quality: "GOOD",
          });

          // Update connection status
          connection.isConnected = true;
          connection.lastSuccessfulRead = new Date();
          
        } catch (error) {
          console.error(`Error reading tag ${tag.tagName} on site ${siteId}:`, error);
          
          // Store bad quality value
          await storage.createSiteDatabaseValue({
            tagId: tag.id,
            value: "0",
            quality: "BAD",
          });

          // Update connection status
          connection.isConnected = false;
        }
      }
    } catch (error) {
      console.error(`Error reading tags for site ${siteId}:`, error);
      connection.isConnected = false;
    }

    connection.lastConnectionAttempt = new Date();
  }

  private async simulateADSRead(connection: ADSConnection, tag: any): Promise<any> {
    // This simulates ADS read operation
    // In real implementation, you would use node-ads library here
    
    // Simulate connection check
    if (Math.random() < 0.1) { // 10% chance of connection failure
      throw new Error("ADS connection timeout");
    }

    // Generate realistic values based on data type
    switch (tag.dataType.toUpperCase()) {
      case 'BOOL':
        return Math.random() > 0.5;
      case 'INT':
      case 'DINT':
        return Math.floor(Math.random() * 1000);
      case 'REAL':
        return parseFloat((Math.random() * 100).toFixed(2));
      case 'STRING':
        return `Value_${Date.now()}`;
      default:
        return Math.floor(Math.random() * 100);
    }
  }

  async addSiteForMonitoring(siteId: string): Promise<void> {
    if (this.connections.has(siteId)) {
      console.log(`Site ${siteId} is already being monitored`);
      return;
    }

    // Initialize connection for new site
    const sites = await storage.getAllSites();
    const site = sites.find(s => s.id === siteId);
    
    if (!site) {
      console.error(`Site ${siteId} not found`);
      return;
    }

    const ipcDevices = await storage.getIpcManagement(siteId);
    if (ipcDevices.length > 0) {
      const ipc = ipcDevices[0];
      
      this.connections.set(siteId, {
        siteId: siteId,
        targetHost: site.ipAddress,
        amsNetId: ipc.amsNetId || "127.0.0.1.1.1:851",
        isConnected: false,
      });

      // Start monitoring for this site
      await this.startSiteTagMonitoring(siteId);
    }
  }

  async removeSiteFromMonitoring(siteId: string): Promise<void> {
    // Stop monitoring interval
    const interval = this.monitoringIntervals.get(siteId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(siteId);
    }

    // Remove connection
    this.connections.delete(siteId);
    
    console.log(`Stopped monitoring for site ${siteId}`);
  }

  getConnectionStatus(): Array<ADSConnection & { tagCount: number }> {
    return Array.from(this.connections.values()).map(conn => ({
      ...conn,
      tagCount: 0, // This would be populated with actual tag count
    }));
  }

  async refreshSiteTags(siteId: string): Promise<void> {
    // Restart monitoring for a site when tags are updated
    await this.removeSiteFromMonitoring(siteId);
    await this.addSiteForMonitoring(siteId);
  }
}

export const adsMonitoringService = new ADSMonitoringService();
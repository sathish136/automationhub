import { storage } from "../storage";
import cron from "node-cron";
import { createConnection } from "net";

interface PingResult {
  isOnline: boolean;
  responseTime?: number;
  error?: string;
}

class PingService {
  private isRunning = false;

  async pingHost(ipAddress: string): Promise<PingResult> {
    return new Promise((resolve) => {
      console.log(`Attempting to connect to ${ipAddress}...`);
      const startTime = Date.now();
      
      // Try to connect to common ports (80, 443, 22, 3389) to test connectivity
      const testPorts = [80, 443, 22, 3389, 21, 23];
      let attempts = 0;
      let connected = false;
      
      const tryPort = (port: number) => {
        const socket = createConnection({ 
          port, 
          host: ipAddress, 
          timeout: 3000 
        });
        
        socket.on('connect', () => {
          if (!connected) {
            connected = true;
            const responseTime = Date.now() - startTime;
            console.log(`Successfully connected to ${ipAddress}:${port} - ${responseTime}ms`);
            socket.destroy();
            resolve({
              isOnline: true,
              responseTime,
              error: undefined
            });
          }
        });
        
        socket.on('error', () => {
          attempts++;
          socket.destroy();
          
          if (attempts >= testPorts.length && !connected) {
            console.log(`No open ports found on ${ipAddress}`);
            resolve({
              isOnline: false,
              responseTime: undefined,
              error: "No accessible ports found"
            });
          }
        });
        
        socket.on('timeout', () => {
          attempts++;
          socket.destroy();
          
          if (attempts >= testPorts.length && !connected) {
            console.log(`Connection timeout for ${ipAddress}`);
            resolve({
              isOnline: false,
              responseTime: undefined,
              error: "Connection timeout"
            });
          }
        });
      };
      
      // Try multiple ports simultaneously
      testPorts.forEach(port => tryPort(port));
      
      // Overall timeout
      setTimeout(() => {
        if (!connected) {
          console.log(`Overall timeout for ${ipAddress}`);
          resolve({
            isOnline: false,
            responseTime: undefined,
            error: "Host unreachable"
          });
        }
      }, 5000);
    });
  }


  async checkAllSites(): Promise<void> {
    try {
      const sites = await storage.getAllSites();
      
      for (const site of sites) {
        await this.checkSiteStatus(site.id, site.ipAddress, site.name);
      }
    } catch (error) {
      console.error("Error checking all sites:", error);
    }
  }

  async checkSiteStatus(siteId: string, ipAddress: string, siteName: string): Promise<void> {
    try {
      const result = await this.pingHost(ipAddress);
      const status = result.isOnline ? "online" : "offline";
      
      // Update site status
      await storage.updateSiteStatus(siteId, status, result.responseTime);
      
      // Add uptime history record
      await storage.addUptimeRecord({
        siteId,
        status,
        responseTime: result.responseTime || null,
        isOnline: result.isOnline,
      });

      // Create alert if site went offline
      if (!result.isOnline) {
        const existingAlerts = await storage.getAlerts(10);
        const recentOfflineAlert = existingAlerts.find(
          alert => 
            alert.siteId === siteId && 
            alert.type === "site_offline" && 
            !alert.isResolved &&
            alert.createdAt && 
            (Date.now() - new Date(alert.createdAt).getTime()) < 60 * 60 * 1000 // Within last hour
        );

        if (!recentOfflineAlert) {
          await storage.createAlert({
            siteId,
            type: "site_offline",
            severity: "critical",
            title: `Site ${siteName} is offline`,
            message: `Site ${siteName} (${ipAddress}) is not responding to ping requests. ${result.error || ""}`,
            metadata: {
              ipAddress,
              error: result.error,
            },
          });
        }
      } else if (result.responseTime && result.responseTime > 1000) {
        // Create warning for high response time
        await storage.createAlert({
          siteId,
          type: "high_response_time",
          severity: "warning",
          title: `High response time for ${siteName}`,
          message: `Site ${siteName} (${ipAddress}) has a response time of ${result.responseTime}ms, which exceeds the normal threshold.`,
          metadata: {
            ipAddress,
            responseTime: result.responseTime,
          },
        });
      }

      console.log(`Ping check for ${siteName} (${ipAddress}): ${status} ${result.responseTime ? `- ${result.responseTime}ms` : ''}`);
    } catch (error) {
      console.error(`Error checking site ${siteName} (${ipAddress}):`, error);
    }
  }

  startMonitoring(): void {
    if (this.isRunning) {
      console.log("Ping monitoring is already running");
      return;
    }

    console.log("Starting ping monitoring service...");
    this.isRunning = true;

    // Check all sites every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      if (this.isRunning) {
        console.log("Running scheduled ping checks...");
        await this.checkAllSites();
      }
    });

    // Initial check
    this.checkAllSites();
  }

  stopMonitoring(): void {
    console.log("Stopping ping monitoring service...");
    this.isRunning = false;
  }

  isMonitoringRunning(): boolean {
    return this.isRunning;
  }
}

export const pingService = new PingService();

import { spawn } from "child_process";
import { storage } from "../storage";
import cron from "node-cron";

interface PingResult {
  isOnline: boolean;
  responseTime?: number;
  error?: string;
}

class PingService {
  private isRunning = false;

  async pingHost(ipAddress: string): Promise<PingResult> {
    return new Promise((resolve) => {
      const isWindows = process.platform === "win32";
      const pingCommand = isWindows ? "ping" : "ping";
      const pingArgs = isWindows 
        ? ["-n", "1", "-w", "5000", ipAddress]
        : ["-c", "1", "-W", "5", ipAddress];

      const ping = spawn(pingCommand, pingArgs);
      let output = "";
      let error = "";

      ping.stdout.on("data", (data) => {
        output += data.toString();
      });

      ping.stderr.on("data", (data) => {
        error += data.toString();
      });

      ping.on("close", (code) => {
        if (code === 0) {
          // Parse response time from output
          const responseTime = this.parseResponseTime(output, isWindows);
          resolve({
            isOnline: true,
            responseTime,
          });
        } else {
          resolve({
            isOnline: false,
            error: error || "Host unreachable",
          });
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        ping.kill();
        resolve({
          isOnline: false,
          error: "Ping timeout",
        });
      }, 10000);
    });
  }

  private parseResponseTime(output: string, isWindows: boolean): number | undefined {
    try {
      if (isWindows) {
        // Windows: "Average = 12ms" or "time=12ms"
        const match = output.match(/time[<=](\d+)ms|Average = (\d+)ms/i);
        return match ? parseInt(match[1] || match[2]) : undefined;
      } else {
        // Linux/macOS: "time=12.345 ms"
        const match = output.match(/time=(\d+(?:\.\d+)?) ms/);
        return match ? Math.round(parseFloat(match[1])) : undefined;
      }
    } catch (error) {
      console.error("Error parsing ping response time:", error);
      return undefined;
    }
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

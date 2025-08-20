import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from '../storage';
import type { Site, SiteDatabaseTag } from '@shared/schema';

// Get the directory name in an ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Alias Site as ADSConnection for consistency within this service
type ADSConnection = Site;

class ADSMonitoringService {
  private static instance: ADSMonitoringService;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): ADSMonitoringService {
    if (!ADSMonitoringService.instance) {
      ADSMonitoringService.instance = new ADSMonitoringService();
    }
    return ADSMonitoringService.instance;
  }

  /**
   * Executes the Python script to read a tag value from the PLC.
   * This is the core function that replaces the direct node-ads connection.
   */
  private readADSTag(tag: SiteDatabaseTag): Promise<number> {
    return new Promise((resolve, reject) => {
      // Path to the Python script, using the correct __dirname for ES modules
      const scriptPath = path.join(__dirname, '..', '..', 'ads.py');
      const pythonProcess = spawn('python', [scriptPath, tag.adsPath]);

      let dataString = '';
      let errorString = '';

      // Capture standard output from the script
      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      // Capture standard error from the script
      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      // Handle the script exit
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`[ADS] Python script exited with code ${code}: ${errorString}`);
          return reject(new Error(`Python script error: ${errorString.trim()}`));
        }
        
        const value = parseFloat(dataString.trim());
        if (isNaN(value)) {
          return reject(new Error('Failed to parse float value from Python script.'));
        }

        console.log(`[ADS] Successfully read tag '${tag.adsPath}', value: ${value}`);
        resolve(value);
      });

      pythonProcess.on('error', (err) => {
        console.error('[ADS] Failed to start Python script.', err);
        reject(err);
      });
    });
  }

  /**
   * Public method to test the connection by reading a single tag.
   * The 'connection' parameter is kept for API compatibility but is no longer used.
   */
  public async testADSConnection(connection: ADSConnection, tag: SiteDatabaseTag): Promise<any> {
    console.log(`[ADS] Testing connection for site ${connection.id} by reading tag ${tag.adsPath}`);
    try {
      const value = await this.readADSTag(tag);
      return { success: true, value };
    } catch (error: any) {
      console.error(`[ADS] Test connection failed for site ${connection.id}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  public startMonitoringForTag(tag: SiteDatabaseTag) {
    // Ensure the tag is active and not already being monitored
    if (tag.isActive && !this.monitoringIntervals.has(tag.id)) {
      console.log(`[ADS] Starting monitoring for new tag: ${tag.tagName} (${tag.adsPath})`);

      const interval = setInterval(async () => {
        try {
          const value = await this.readADSTag(tag);
          // Save the new value to the database
          await storage.createSiteDatabaseValue({
            tagId: tag.id,
            value: value.toString(),
          });
        } catch (error) {
          console.error(`[ADS] Error monitoring tag ${tag.tagName}:`, error);
        }
      }, tag.scanInterval || 5000); // Use tag's interval or default to 5s

      this.monitoringIntervals.set(tag.id, interval);
    }
  }

  public startMonitoringAllSites(connections: ADSConnection[], tags: SiteDatabaseTag[]) {
    console.log(`[ADS] Starting monitoring for ${tags.length} tags across ${connections.length} sites.`);
    
    for (const tag of tags) {
      this.startMonitoringForTag(tag);
    }
  }

  public stopMonitoringForSite(siteId: string) {
    // This would need to be adapted to stop monitoring by site, e.g. by finding all tags for that site
    console.log(`[ADS] Stopping monitoring for site ${siteId}...`);
    for (const [tagId, interval] of this.monitoringIntervals.entries()) {
      // This is a simplified stop, a real implementation would need to map siteId to tagIds
      clearInterval(interval);
      this.monitoringIntervals.delete(tagId);
    }
  }
}

export const adsMonitoringService = ADSMonitoringService.getInstance();

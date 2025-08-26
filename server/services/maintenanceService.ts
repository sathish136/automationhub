import { storage } from "../storage";
import { sendMaintenanceAlert } from "./emailService";
import cron from "node-cron";

export class MaintenanceService {
  private isRunning = false;

  constructor() {
    console.log("[MAINTENANCE] Starting maintenance monitoring service...");
    this.startScheduledCheck();
  }

  // Start automated maintenance checking every hour
  startScheduledCheck() {
    // Run every hour at minute 0
    cron.schedule("0 * * * *", async () => {
      if (!this.isRunning) {
        console.log("[MAINTENANCE] Running hourly maintenance check...");
        await this.checkMaintenanceDue();
      }
    });

    // Also run immediately on startup
    this.checkMaintenanceDue();
  }

  // Main function to check all equipment for maintenance due
  async checkMaintenanceDue() {
    this.isRunning = true;
    try {
      // Get all equipment due for maintenance
      const equipmentDue = await storage.getEquipmentDueForMaintenance();
      
      if (equipmentDue.length === 0) {
        console.log("[MAINTENANCE] No equipment due for maintenance");
        return;
      }

      console.log(`[MAINTENANCE] Found ${equipmentDue.length} equipment items requiring maintenance attention`);

      for (const item of equipmentDue) {
        await this.processMaintenanceItem(item);
      }

      // Update equipment running hours from database
      await this.updateRunningHoursFromDatabase();

    } catch (error) {
      console.error("[MAINTENANCE] Error checking maintenance due:", error);
    } finally {
      this.isRunning = false;
    }
  }

  // Process individual maintenance item
  async processMaintenanceItem(item: any) {
    try {
      const currentHours = parseFloat(item.currentHours) || 0;
      const nextDueHours = parseFloat(item.nextDueHours) || 0;
      const warningThreshold = parseFloat(item.warningThreshold) || 100;
      const criticalThreshold = parseFloat(item.criticalThreshold) || 50;

      const hoursUntilDue = nextDueHours - currentHours;
      const hoursOverdue = currentHours > nextDueHours ? currentHours - nextDueHours : 0;

      let emailType = "info";
      let shouldSendEmail = false;

      if (hoursOverdue > 0) {
        emailType = "overdue";
        shouldSendEmail = true;
        console.log(`[MAINTENANCE] ${item.equipmentName} is ${hoursOverdue} hours overdue for ${item.maintenanceType}`);
      } else if (hoursUntilDue <= criticalThreshold) {
        emailType = "critical";
        shouldSendEmail = true;
        console.log(`[MAINTENANCE] ${item.equipmentName} has ${hoursUntilDue} hours until ${item.maintenanceType} maintenance (Critical)`);
      } else if (hoursUntilDue <= warningThreshold) {
        emailType = "warning";
        shouldSendEmail = true;
        console.log(`[MAINTENANCE] ${item.equipmentName} has ${hoursUntilDue} hours until ${item.maintenanceType} maintenance (Warning)`);
      }

      if (shouldSendEmail) {
        // Check if we've already sent an email recently (avoid spam)
        const schedules = await storage.getMaintenanceSchedules(item.equipmentId);
        const schedule = schedules.find(s => s.maintenanceType === item.maintenanceType);
        
        if (schedule && this.shouldSendEmail(schedule, emailType)) {
          await this.sendMaintenanceEmail(item, schedule, emailType, hoursOverdue, hoursUntilDue);
        }
      }

    } catch (error) {
      console.error(`[MAINTENANCE] Error processing maintenance for ${item.equipmentName}:`, error);
    }
  }

  // Check if we should send email based on frequency and last sent time
  shouldSendEmail(schedule: any, emailType: string): boolean {
    if (!schedule.enableEmailAlerts) {
      return false;
    }

    const lastEmailSent = schedule.lastEmailSent;
    const emailFrequency = schedule.emailFrequency || "daily";

    if (!lastEmailSent) {
      return true; // Never sent before
    }

    const now = new Date();
    const lastSent = new Date(lastEmailSent);
    const hoursSinceLastEmail = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

    switch (emailFrequency) {
      case "once":
        return false; // Only send once ever
      case "daily":
        return hoursSinceLastEmail >= 24;
      case "weekly":
        return hoursSinceLastEmail >= 168; // 7 days * 24 hours
      default:
        return hoursSinceLastEmail >= 24; // Default to daily
    }
  }

  // Send maintenance email
  async sendMaintenanceEmail(
    equipment: any, 
    schedule: any, 
    emailType: string,
    hoursOverdue: number,
    hoursUntilDue: number
  ) {
    try {
      // Get equipment details
      const equipmentDetails = await storage.getEquipment(equipment.equipmentId);
      if (!equipmentDetails || !equipmentDetails.maintenanceEmailEnabled) {
        return;
      }

      const emailRecipients = equipmentDetails.emailRecipients || [];
      if (emailRecipients.length === 0) {
        console.log(`[MAINTENANCE] No email recipients configured for ${equipment.equipmentName}`);
        return;
      }

      // Generate email subject and body
      const { subject, body } = this.generateEmailContent(
        equipment,
        schedule,
        emailType,
        hoursOverdue,
        hoursUntilDue
      );

      // Send email using email service
      const emailSent = await sendMaintenanceAlert(emailRecipients, subject, body);

      if (emailSent) {
        // Log email sent
        await storage.createMaintenanceEmailLog({
          equipmentId: equipment.equipmentId,
          scheduleId: schedule.id,
          emailType: emailType,
          recipients: emailRecipients,
          subject,
          body,
          equipmentHours: equipment.currentHours,
          maintenanceDueHours: equipment.nextDueHours,
          hoursOverdue: hoursOverdue > 0 ? hoursOverdue : null,
          emailStatus: "sent",
          triggeredBy: "system",
        });

        // Update last email sent time
        await storage.updateMaintenanceSchedule(schedule.id, {
          lastEmailSent: new Date(),
        });

        console.log(`[MAINTENANCE] Email sent for ${equipment.equipmentName} - ${emailType}`);
      }

    } catch (error) {
      console.error(`[MAINTENANCE] Error sending email for ${equipment.equipmentName}:`, error);
    }
  }

  // Generate email content
  generateEmailContent(
    equipment: any,
    schedule: any,
    emailType: string,
    hoursOverdue: number,
    hoursUntilDue: number
  ) {
    const equipmentName = equipment.equipmentName;
    const maintenanceType = schedule.maintenanceType.replace('_', ' ').toUpperCase();
    const currentHours = parseFloat(equipment.currentHours).toLocaleString();
    const dueHours = parseFloat(equipment.nextDueHours).toLocaleString();

    let subject = "";
    let urgencyLevel = "";
    let timeInfo = "";

    switch (emailType) {
      case "overdue":
        subject = `🚨 OVERDUE: ${equipmentName} - ${maintenanceType} Required`;
        urgencyLevel = "OVERDUE";
        timeInfo = `Equipment is ${hoursOverdue} hours overdue for maintenance.`;
        break;
      case "critical":
        subject = `🔴 CRITICAL: ${equipmentName} - ${maintenanceType} Due Soon`;
        urgencyLevel = "CRITICAL";
        timeInfo = `Equipment needs maintenance in ${hoursUntilDue} hours.`;
        break;
      case "warning":
        subject = `⚠️ WARNING: ${equipmentName} - ${maintenanceType} Approaching`;
        urgencyLevel = "WARNING";
        timeInfo = `Equipment needs maintenance in ${hoursUntilDue} hours.`;
        break;
      default:
        subject = `📋 MAINTENANCE: ${equipmentName} - ${maintenanceType}`;
        urgencyLevel = "INFO";
        timeInfo = `Maintenance information update.`;
    }

    const body = `
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(90deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert { padding: 15px; border-radius: 5px; margin: 10px 0; }
        .overdue { background-color: #fee2e2; border-left: 4px solid #dc2626; }
        .critical { background-color: #fef3c7; border-left: 4px solid #f59e0b; }
        .warning { background-color: #ddd6fe; border-left: 4px solid #8b5cf6; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .info-table th { background-color: #f8fafc; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 AutomationHub Maintenance Alert</h1>
        <h2>${urgencyLevel} - ${equipmentName}</h2>
    </div>
    
    <div class="content">
        <div class="alert ${emailType}">
            <h3>⚡ ${maintenanceType} Required</h3>
            <p><strong>${timeInfo}</strong></p>
        </div>
        
        <h3>Equipment Details:</h3>
        <table class="info-table">
            <tr><th>Equipment Name</th><td>${equipmentName}</td></tr>
            <tr><th>Equipment Type</th><td>${equipment.equipmentType}</td></tr>
            <tr><th>Maintenance Type</th><td>${maintenanceType}</td></tr>
            <tr><th>Current Running Hours</th><td>${currentHours} hours</td></tr>
            <tr><th>Maintenance Due At</th><td>${dueHours} hours</td></tr>
            <tr><th>Priority</th><td>${schedule.priority.toUpperCase()}</td></tr>
            ${schedule.estimatedDuration ? `<tr><th>Estimated Duration</th><td>${schedule.estimatedDuration} minutes</td></tr>` : ''}
        </table>
        
        ${schedule.instructions ? `
        <h3>📋 Maintenance Instructions:</h3>
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${schedule.instructions.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
        
        ${schedule.requiredParts && schedule.requiredParts.length > 0 ? `
        <h3>🔧 Required Parts:</h3>
        <ul>
            ${schedule.requiredParts.map((part: string) => `<li>${part}</li>`).join('')}
        </ul>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5000/maintenance" class="button">
                🔗 Open Maintenance Dashboard
            </a>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated maintenance alert from AutomationHub</p>
        <p>Generated at: ${new Date().toLocaleString()}</p>
        <p>Please do not reply to this email. For support, contact your system administrator.</p>
    </div>
</body>
</html>
    `;

    return { subject, body };
  }

  // Update running hours from database - this connects to your SQL database
  async updateRunningHoursFromDatabase() {
    try {
      console.log("[MAINTENANCE] Updating running hours from database...");
      
      // Get all equipment with PLC tag connections
      const allEquipment = await storage.getAllEquipment();
      let updatedCount = 0;

      for (const equip of allEquipment) {
        if (equip.plcTagId && equip.hoursDataSource === "plc_tag") {
          // Get current value from PLC tag
          const plcTag = await storage.getPlcTag(equip.plcTagId);
          if (plcTag && plcTag.lastValue) {
            const currentHours = parseFloat(plcTag.lastValue) || 0;
            
            // Update equipment running hours if different
            if (currentHours !== parseFloat(equip.currentRunningHours.toString())) {
              await storage.updateEquipment(equip.id, {
                currentRunningHours: currentHours,
                lastHoursUpdate: new Date(),
              });
              updatedCount++;
              console.log(`[MAINTENANCE] Updated ${equip.equipmentName}: ${currentHours} hours`);
            }
          }
        } else if (equip.hoursDataSource === "calculated") {
          // Calculate running hours based on equipment status/runtime
          // This could integrate with your existing database queries
          await this.calculateRunningHours(equip);
        }
      }

      if (updatedCount > 0) {
        console.log(`[MAINTENANCE] Updated running hours for ${updatedCount} equipment items`);
      }

    } catch (error) {
      console.error("[MAINTENANCE] Error updating running hours:", error);
    }
  }

  // Calculate running hours for equipment without direct PLC tags
  async calculateRunningHours(equipment: any) {
    try {
      // This could connect to your existing SQL database to get runtime data
      // Example: Query equipment status over time and calculate accumulated runtime
      
      // For now, we'll increment hours based on active status
      if (equipment.status === "active") {
        const lastUpdate = new Date(equipment.lastHoursUpdate || equipment.updatedAt);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate >= 1) { // Update every hour
          const newHours = parseFloat(equipment.currentRunningHours.toString()) + hoursSinceUpdate;
          
          await storage.updateEquipment(equipment.id, {
            currentRunningHours: newHours,
            lastHoursUpdate: new Date(),
          });

          console.log(`[MAINTENANCE] Calculated ${equipment.equipmentName}: ${newHours.toFixed(2)} hours (+${hoursSinceUpdate.toFixed(2)})`);
        }
      }

    } catch (error) {
      console.error(`[MAINTENANCE] Error calculating hours for ${equipment.equipmentName}:`, error);
    }
  }

  // Manual trigger for immediate maintenance check
  async triggerMaintenanceCheck() {
    console.log("[MAINTENANCE] Manual maintenance check triggered");
    await this.checkMaintenanceDue();
  }

  // Send manual maintenance email
  async sendManualEmail(equipmentId: string, scheduleId?: string) {
    try {
      const equipment = await storage.getEquipment(equipmentId);
      if (!equipment) {
        throw new Error("Equipment not found");
      }

      let schedule = null;
      if (scheduleId) {
        const schedules = await storage.getMaintenanceSchedules(equipmentId);
        schedule = schedules.find(s => s.id === scheduleId);
      } else {
        // Get the most urgent schedule
        const schedules = await storage.getMaintenanceSchedules(equipmentId);
        if (schedules.length > 0) {
          schedule = schedules[0]; // First one (ordered by next due hours)
        }
      }

      if (!schedule) {
        throw new Error("No maintenance schedule found");
      }

      const currentHours = parseFloat(equipment.currentRunningHours.toString());
      const nextDueHours = parseFloat(schedule.nextMaintenanceHours.toString());
      const hoursOverdue = currentHours > nextDueHours ? currentHours - nextDueHours : 0;
      const hoursUntilDue = nextDueHours - currentHours;

      const emailType = hoursOverdue > 0 ? "overdue" : 
                       hoursUntilDue <= schedule.criticalThresholdHours ? "critical" : "manual";

      await this.sendMaintenanceEmail({
        equipmentId: equipment.id,
        equipmentName: equipment.equipmentName,
        equipmentType: equipment.equipmentType,
        currentHours: currentHours,
        nextDueHours: nextDueHours,
        maintenanceType: schedule.maintenanceType,
      }, schedule, emailType, hoursOverdue, hoursUntilDue);

      return true;

    } catch (error) {
      console.error("[MAINTENANCE] Error sending manual email:", error);
      throw error;
    }
  }
}

export const maintenanceService = new MaintenanceService();
import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("[EMAIL] SendGrid initialized successfully");
} else {
  console.warn("[EMAIL] SendGrid API key not found. Email functionality will be limited.");
}

export interface EmailParams {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Generic email sending function
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn("[EMAIL] SendGrid not configured. Email not sent:", params.subject);
    return false;
  }

  try {
    const msg = {
      to: Array.isArray(params.to) ? params.to : [params.to],
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Email sent successfully: ${params.subject}`);
    return true;

  } catch (error: any) {
    console.error("[EMAIL] Failed to send email:", error);
    
    // Log more details about the error
    if (error.response) {
      console.error("[EMAIL] Error response:", error.response.body);
    }
    
    return false;
  }
}

// Maintenance alert email function
export async function sendMaintenanceAlert(
  recipients: string[],
  subject: string,
  htmlBody: string
): Promise<boolean> {
  if (!recipients || recipients.length === 0) {
    console.warn("[EMAIL] No recipients provided for maintenance alert");
    return false;
  }

  // Default sender - you might want to configure this
  const fromEmail = process.env.MAINTENANCE_EMAIL_FROM || "maintenance@automationhub.com";

  return await sendEmail({
    to: recipients,
    from: fromEmail,
    subject: subject,
    html: htmlBody,
    text: htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  });
}

// Test email function
export async function sendTestEmail(to: string): Promise<boolean> {
  const subject = "🔧 AutomationHub Maintenance System - Test Email";
  const htmlBody = `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(90deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center;">
            <h1>🔧 AutomationHub Maintenance System</h1>
            <h2>Test Email - System Working!</h2>
        </div>
        
        <div style="padding: 20px;">
            <p>This is a test email to verify that your maintenance alert system is working correctly.</p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <h3>✅ Email System Status: Operational</h3>
                <p>Your automated maintenance alerts are now configured and ready to send notifications when equipment needs maintenance.</p>
            </div>
            
            <h3>What happens next:</h3>
            <ul>
                <li>System monitors equipment running hours automatically</li>
                <li>Checks maintenance schedules every hour</li>
                <li>Sends alerts when maintenance is due (warning, critical, overdue)</li>
                <li>Updates equipment hours from your database</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5000/maintenance" 
                   style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
                    🔗 Open Maintenance Dashboard
                </a>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>AutomationHub Maintenance System - Test Email</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: to,
    from: process.env.MAINTENANCE_EMAIL_FROM || "maintenance@automationhub.com",
    subject: subject,
    html: htmlBody,
    text: "AutomationHub Maintenance System - Test Email. Your email system is working correctly!",
  });
}
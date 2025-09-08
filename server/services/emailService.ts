import nodemailer from "nodemailer";
import type { Newsletter } from "@shared/schema";
import { storage } from "../storage";

// Configure email transporter
const transporter = nodemailer.createTransport({
  // Use environment variables for email service configuration
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendNewsletter(newsletter: Newsletter): Promise<void> {
  try {
    // Get team information
    const team = await storage.getTeam(newsletter.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Get all team athletes and their emails
    const athletes = await storage.getAthletesByTeam(newsletter.teamId);
    const allEmails: string[] = [];
    
    for (const athlete of athletes) {
      const emails = await storage.getAthleteEmails(athlete.id);
      allEmails.push(...emails.map(e => e.email));
    }

    if (allEmails.length === 0) {
      throw new Error("No email addresses found for this team");
    }

    // Generate HTML email content
    const htmlContent = generateNewsletterHTML(newsletter, team, athletes);

    // Send email to all recipients
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      bcc: allEmails, // Use BCC to protect recipient privacy
      subject: newsletter.subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    // Update newsletter with recipient count
    await storage.updateNewsletter(newsletter.id, {
      recipientCount: allEmails.length,
    });

    console.log(`Newsletter sent to ${allEmails.length} recipients`);
  } catch (error) {
    console.error("Error sending newsletter:", error);
    throw new Error("Failed to send newsletter: " + (error instanceof Error ? error.message : String(error)));
  }
}

function generateNewsletterHTML(newsletter: Newsletter, team: any, athletes: any[]): string {
  const athleteMessages = newsletter.athleteMessages as any[] || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${newsletter.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: ${team.primaryColor || '#3B82F6'}; color: white; padding: 30px; text-align: center; }
        .logo { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .content { padding: 30px; }
        .team-message { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .athlete-section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${team.primaryColor || '#3B82F6'}; }
        .athlete-name { font-weight: bold; color: ${team.primaryColor || '#3B82F6'}; margin-bottom: 5px; }
        .athlete-details { font-size: 14px; color: #666; margin-bottom: 10px; }
        .cta-section { text-align: center; padding: 30px; background: #f8f9fa; border-top: 1px solid #eee; }
        .cta-button { display: inline-block; padding: 12px 24px; background: ${team.primaryColor || '#3B82F6'}; color: white; text-decoration: none; border-radius: 5px; margin: 0 10px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🤼</div>
          <h1>${team.name}</h1>
          <p>${team.school}</p>
          <p style="font-size: 14px; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="content">
          ${newsletter.teamMessage ? `
            <div class="team-message">
              <h2>Coach's Message</h2>
              <p>${newsletter.teamMessage}</p>
            </div>
          ` : ''}
          
          ${athleteMessages.length > 0 ? `
            <h2>Athlete Highlights</h2>
            ${athleteMessages.map(msg => `
              <div class="athlete-section">
                <div class="athlete-name">${msg.athleteName}</div>
                <div class="athlete-details">${msg.grade} • ${msg.weightClass}</div>
                <p>${msg.message}</p>
              </div>
            `).join('')}
          ` : ''}
        </div>
        
        <div class="cta-section">
          <p>Support our team's success!</p>
          <a href="#" class="cta-button">Support Our Team</a>
          ${team.teamStoreUrl ? `<a href="${team.teamStoreUrl}" class="cta-button">Team Store</a>` : ''}
        </div>
        
        <div class="footer">
          <p>This email was sent by ${team.name} wrestling team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendCustomEmail(
  teamId: string,
  subject: string,
  content: string
): Promise<void> {
  try {
    const team = await storage.getTeam(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const athletes = await storage.getAthletesByTeam(teamId);
    const allEmails: string[] = [];
    
    for (const athlete of athletes) {
      const emails = await storage.getAthleteEmails(athlete.id);
      allEmails.push(...emails.map(e => e.email));
    }

    if (allEmails.length === 0) {
      throw new Error("No email addresses found for this team");
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      bcc: allEmails,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${team.primaryColor || '#3B82F6'};">${team.name}</h2>
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            This email was sent by ${team.name} wrestling team.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Custom email sent to ${allEmails.length} recipients`);
  } catch (error) {
    console.error("Error sending custom email:", error);
    throw new Error("Failed to send custom email: " + (error instanceof Error ? error.message : String(error)));
  }
}

import nodemailer from 'nodemailer';
import { Task } from '../type';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465, // Must be true for port 465
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

export const emailService = {
  sendTaskNotification: async (
    emails: string[],
    task: Partial<Task>,
    isUpdate = false
  ) => {
    if (!emails || emails.length === 0) return;
    
    // Only send if credentials are provided or we might fail.
    // If not provided in .env, we log a warning but don't break the app.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials not provided. Skipping email notification to:", emails);
      return;
    }

    const subject = isUpdate 
      ? `Activity Updated: ${task.title}` 
      : `New Activity Assigned: ${task.title}`;

    const priorityBadge = 
      task.priority === "Urgent" ? "🔴 Urgent" :
      task.priority === "High" ? "🟠 High" :
      task.priority === "Medium" ? "🟡 Medium" : "🟢 Low";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; color: white;">
          <h2 style="margin: 0;">${subject}</h2>
        </div>
        <div style="padding: 20px; background-color: #f8fafc;">
          <p>You have been assigned to a schedule of activity.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #0f172a;">${task.title}</h3>
            ${task.description ? `<p style="color: #475569; white-space: pre-wrap;">${task.description}</p>` : ''}
            
            <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Category:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${task.category || 'Task'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Priority:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${priorityBadge}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Status:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${task.status || 'Pending'}</td>
              </tr>
              ${task.start_date || task.end_date ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Schedule:</td>
                <td style="padding: 8px 0; font-weight: bold;">
                  ${task.start_date ? new Date(task.start_date).toLocaleString() : 'No start'} 
                  &rarr; 
                  ${task.end_date ? new Date(task.end_date).toLocaleString() : 'No deadline'}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
            This is an automated notification from the Vertex OS Holdings Management System.
          </p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Vertex OS" <${process.env.SMTP_USER}>`,
        to: emails,
        subject,
        html,
      });
      console.log(`Successfully sent email notification to ${emails.length} users.`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  },
};

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    // If email credentials are not configured, log to console instead
    if (!emailUser || !emailPassword) {
      console.log('⚠️  Email service not configured. Emails will be logged to console.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If transporter is not configured, log to console
      if (!this.transporter) {
        console.log('\n📧 ═══════════════════════════════════════');
        console.log('📧 EMAIL (Development Mode)');
        console.log('📧 ═══════════════════════════════════════');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('─────────────────────────────────────────');
        console.log(options.text);
        console.log('═══════════════════════════════════════\n');

        // Also append to a file for easier retrieval
        const logPath = path.join(process.cwd(), 'email-logs.txt');
        const logEntry = `\n[${new Date().toISOString()}] To: ${options.to}\nSubject: ${options.subject}\n${options.text}\n----------------------------------------\n`;
        fs.appendFileSync(logPath, logEntry);
        
        return true;
      }

      // Send actual email
      await this.transporter.sendMail({
        from: `"Pixel Racing" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    frontendUrl: string
  ): Promise<boolean> {
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const text = `
Hello,

You requested to reset your password for Pixel Racing.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Happy Racing! 🏁
Pixel Racing Team
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">🏁 Pixel Racing - Password Reset</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for Pixel Racing.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(to right, #f59e0b, #ec4899); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 8px;
                    display: inline-block;
                    font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Happy Racing! 🏁<br>
          Pixel Racing Team
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: '🏁 Reset Your Pixel Racing Password',
      text,
      html,
    });
  }
}

export const emailService = new EmailService();

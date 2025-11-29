import nodemailer from 'nodemailer';
// import fs from 'fs';
// import path from 'path';

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

      console.log(' Email service initialized');
    } catch (error) {
      console.error(' Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If transporter is not configured, log to console
      if (!this.transporter) {
        console.log('\n ═══════════════════════════════════════');
        console.log(' EMAIL (Development Mode)');
        console.log(' ═══════════════════════════════════════');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('─────────────────────────────────────────');
        console.log(options.text);
        console.log('═══════════════════════════════════════\n');

        // Also append to a file for easier retrieval
        // const logPath = path.join(process.cwd(), 'email-logs.txt');
        // const logEntry = `\n[${new Date().toISOString()}] To: ${options.to}\nSubject: ${options.subject}\n${options.text}\n----------------------------------------\n`;
        // fs.appendFileSync(logPath, logEntry);
        
        return true;
      }

      // Send actual email
      await this.transporter.sendMail({
        from: `"Light Racing" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(` Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error(' Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    otp: string
  ): Promise<boolean> {
    const text = `
Hello,

You requested to reset your password for Light Racing.

Your password reset OTP is:

${otp}

This OTP will expire in 10 minutes.

To reset your password:
1. Go to the Reset Password page
2. Enter your email address
3. Enter this OTP
4. Set your new password

If you didn't request this, please ignore this email.

Happy Racing! 🏁
Light Racing Team
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">🏁 Light Racing - Password Reset</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for Light Racing.</p>
        <p>Your password reset OTP is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: linear-gradient(to right, #f59e0b, #ec4899); 
                     color: white; 
                     padding: 20px 40px; 
                     font-size: 32px;
                     font-weight: bold;
                     letter-spacing: 8px;
                     border-radius: 12px;
                     display: inline-block;
                     font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">
          This OTP will expire in <strong>10 minutes</strong>.
        </p>
        <p style="color: #666; font-size: 14px;">
          To reset your password:
        </p>
        <ol style="color: #666; font-size: 14px;">
          <li>Go to the Reset Password page</li>
          <li>Enter your email address</li>
          <li>Enter this OTP</li>
          <li>Set your new password</li>
        </ol>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Happy Racing! 🏁<br>
          Light Racing Team
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: '🏁 Your Light Racing Password Reset OTP',
      text,
      html,
    });
  }
}

export const emailService = new EmailService();

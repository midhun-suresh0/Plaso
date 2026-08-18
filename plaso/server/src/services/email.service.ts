import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import env from '../config/env';

/**
 * Service to handle sending emails.
 * In development, if email credentials are not fully configured,
 * it safely logs the email contents instead.
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.init();
  }

  private async init() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (emailHost && emailUser && emailPassword) {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort || 587,
        secure: emailPort === 465,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
      this.isConfigured = true;
      
      // Verification per requirements
      try {
        console.log('[EMAIL] SMTP verification started');
        await this.transporter.verify();
        console.log('[EMAIL] SMTP verification successful');
        logger.info('Email service initialized with SMTP credentials.');
      } catch (error: any) {
        console.log(`[EMAIL] SMTP verification failed: ${error.message}`);
        console.log('[EMAIL ERROR]');
        console.log(`code: ${error.code || 'UNKNOWN'}`);
        console.log(`command: ${error.command || 'UNKNOWN'}`);
        console.log(`response: ${error.response || 'UNKNOWN'}`);
        logger.warn('Email service failed SMTP verification, but is configured.');
      }
    } else {
      logger.warn('Email service running in development mode without SMTP credentials.');
      console.log('[EMAIL] MODE = SIMULATION');
    }
  }

  /**
   * Send an email or log it to the console if unconfigured in DEV mode.
   */
  async sendEmail(options: { to: string; subject: string; text: string; html?: string }): Promise<void> {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@plaso.app';

    if (this.isConfigured && this.transporter) {
      console.log('[EMAIL] MODE = SMTP');
      console.log('[EMAIL] Send started');
      try {
        const info = await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        
        console.log(`[EMAIL] Message accepted: ${info.accepted?.length > 0 ? 'YES' : 'NO'}`);
        console.log(`[EMAIL] Message ID: ${info.messageId}`);
        console.log(`[EMAIL] Provider response: ${info.response}`);
        logger.info(`Email sent successfully to ${options.to}`);
      } catch (error: any) {
        console.log('[EMAIL ERROR]');
        console.log(`code: ${error.code || 'UNKNOWN'}`);
        console.log(`command: ${error.command || 'UNKNOWN'}`);
        console.log(`response: ${error.response || error.message || 'UNKNOWN'}`);
        
        logger.error('Failed to send email via SMTP:', error.message);
        throw new Error('Failed to send email');
      }
    } else if (env.nodeEnv === 'development') {
      // Development fallback
      logger.info('========== DEVELOPMENT EMAIL SIMULATION ==========');
      logger.info(`TO: ${options.to}`);
      logger.info(`SUBJECT: ${options.subject}`);
      logger.info(`TEXT: ${options.text}`);
      logger.info('==================================================');
    } else {
      logger.error('Email service is not configured for production use!');
      throw new Error('Email service is not configured');
    }
  }

  /**
   * Send a password reset email with a 6-digit OTP.
   */
  async sendPasswordResetEmail(to: string, otp: string, userName: string): Promise<void> {
    const subject = 'Your Plaso Password Reset OTP';
    
    const text = `Hello ${userName},\n\nWe received a request to reset your Plaso password.\n\nYour verification code is:\n\n${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you did not request this password reset, you can safely ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF206E;">PLASO Password Reset</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>We received a request to reset your Plaso password.</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This OTP expires in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you did not request this password reset, you can safely ignore this email.</p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html });
  }
}

export const emailService = new EmailService();

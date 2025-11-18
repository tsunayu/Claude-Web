import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { config } from '../../config';
import { templateService, NotificationData, TemplateContext } from '../template.service';

export interface EmailConfig {
  provider: 'sendgrid' | 'smtp';
  to: string;
  subject?: string;
  from?: string;
  // SendGrid config
  sendgridApiKey?: string;
  // SMTP config
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export class EmailNotifier {
  private sendgridConfigured = false;
  private smtpTransporter?: nodemailer.Transporter;

  constructor() {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.sendgridConfigured = true;
      console.log('[EmailNotifier] SendGrid configured');
    }
  }

  private initializeSMTP(smtpConfig: EmailConfig['smtp']) {
    if (!smtpConfig) return;

    this.smtpTransporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
    });

    console.log('[EmailNotifier] SMTP configured');
  }

  async send(emailConfig: EmailConfig, data: NotificationData, context: Partial<TemplateContext> = {}) {
    const fullContext: TemplateContext = {
      data,
      timestamp: new Date().toISOString(),
      ...context,
    };

    const htmlContent = templateService.render('email-html', fullContext);
    const textContent = templateService.render('email-text', fullContext);

    const subject = emailConfig.subject || `[IAH] ${data.title}`;
    const from = emailConfig.from || process.env.EMAIL_FROM || 'noreply@iah.example.com';

    if (emailConfig.provider === 'sendgrid') {
      return this.sendViaSendGrid(emailConfig.to, from, subject, htmlContent, textContent);
    } else {
      return this.sendViaSMTP(emailConfig, from, subject, htmlContent, textContent);
    }
  }

  private async sendViaSendGrid(to: string, from: string, subject: string, html: string, text: string) {
    if (!this.sendgridConfigured) {
      throw new Error('SendGrid is not configured. Please set SENDGRID_API_KEY environment variable.');
    }

    try {
      const msg = {
        to,
        from,
        subject,
        text,
        html,
      };

      const result = await sgMail.send(msg);
      console.log(`[EmailNotifier] Email sent via SendGrid to ${to}`);
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        provider: 'sendgrid',
      };
    } catch (error: any) {
      console.error('[EmailNotifier] SendGrid error:', error.response?.body || error.message);
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
    }
  }

  private async sendViaSMTP(
    emailConfig: EmailConfig,
    from: string,
    subject: string,
    html: string,
    text: string
  ) {
    if (!emailConfig.smtp) {
      throw new Error('SMTP configuration is required');
    }

    if (!this.smtpTransporter) {
      this.initializeSMTP(emailConfig.smtp);
    }

    try {
      const info = await this.smtpTransporter!.sendMail({
        from,
        to: emailConfig.to,
        subject,
        text,
        html,
      });

      console.log(`[EmailNotifier] Email sent via SMTP to ${emailConfig.to}: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
      };
    } catch (error: any) {
      console.error('[EmailNotifier] SMTP error:', error.message);
      throw new Error(`Failed to send email via SMTP: ${error.message}`);
    }
  }

  /**
   * Verify email configuration
   */
  async verify(emailConfig: EmailConfig): Promise<boolean> {
    if (emailConfig.provider === 'sendgrid') {
      return this.sendgridConfigured;
    } else if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
      try {
        if (!this.smtpTransporter) {
          this.initializeSMTP(emailConfig.smtp);
        }
        await this.smtpTransporter!.verify();
        return true;
      } catch (error) {
        console.error('[EmailNotifier] SMTP verification failed:', error);
        return false;
      }
    }
    return false;
  }
}

export const emailNotifier = new EmailNotifier();

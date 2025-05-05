
import nodemailer from 'nodemailer';
import { User } from '@prisma/client';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    // For development, we'll use ethereal.email
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  static async sendVerificationEmail(user: User, token: string) {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@aichatembedplatform.com',
      to: user.email,
      subject: 'Verify your email address',
      html: `
        <h1>Welcome to AI Chat Embed Platform!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
  }

  static async sendPasswordResetEmail(user: User, token: string) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@aichatembedplatform.com',
      to: user.email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
  }
} 
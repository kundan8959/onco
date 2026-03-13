import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildNotificationEmail } from './email-templates';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationChannel, User } from './entities';
import { NotificationsGateway } from './notifications.gateway';
import { EmailJobsService } from './email-jobs.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private configService: ConfigService,
    private gateway: NotificationsGateway,
    private emailJobsService: EmailJobsService,
  ) {
    this.initializeMailer();
  }

  private initializeMailer() {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT', '587'));
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not fully configured; email notifications will be skipped');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  async listForUser(username: string) {
    return this.notificationRepo.find({
      where: { recipient_username: username },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(username: string) {
    return this.notificationRepo.count({ where: { recipient_username: username, is_read: false } });
  }

  async markRead(id: number, username: string) {
    const notification = await this.notificationRepo.findOne({ where: { id, recipient_username: username } });
    if (!notification) return null;
    notification.is_read = true;
    notification.read_at = new Date();
    const saved = await this.notificationRepo.save(notification);
    this.gateway.emitUnreadCount(username, await this.getUnreadCount(username));
    return saved;
  }

  async markAllRead(username: string) {
    const notifications = await this.notificationRepo.find({ where: { recipient_username: username, is_read: false } });
    if (!notifications.length) return { updated: 0 };
    for (const notification of notifications) {
      notification.is_read = true;
      notification.read_at = new Date();
    }
    await this.notificationRepo.save(notifications);
    this.gateway.emitUnreadCount(username, 0);
    return { updated: notifications.length };
  }

  async notify(params: {
    recipientUsername: string;
    title: string;
    message: string;
    type?: string;
    category?: string;
    actionUrl?: string;
    channel?: NotificationChannel;
  }) {
    const notification = this.notificationRepo.create({
      recipient_username: params.recipientUsername,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      category: params.category || 'general',
      action_url: params.actionUrl || null,
      channel: params.channel || NotificationChannel.IN_APP,
    });

    const saved = await this.notificationRepo.save(notification);
    this.gateway.emitNotification(saved);
    this.gateway.emitUnreadCount(params.recipientUsername, await this.getUnreadCount(params.recipientUsername));

    if (saved.channel === NotificationChannel.EMAIL || saved.channel === NotificationChannel.BOTH) {
      await this.sendEmailIfPossible(saved);
    }

    return saved;
  }

  async notifyMany(recipients: string[], payload: Omit<Parameters<NotificationsService['notify']>[0], 'recipientUsername'>) {
    for (const recipient of [...new Set(recipients)].filter(Boolean)) {
      await this.notify({ recipientUsername: recipient, ...payload });
    }
  }

  async sendDirectEmail(to: string, subject: string, html: string) {
    if (!this.transporter || !to) return false;
    const from = this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('MAIL_USER');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Onco EHR');
    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send direct email to ${to}: ${String(error)}`);
      return false;
    }
  }

  async queueDirectEmail(to: string, subject: string, html: string) {
    console.log(`Queueing direct email to ${to} with subject "${subject}"`);
    if (!to) return false;
    await this.emailJobsService.enqueue({ to, subject, html });
    return true;
  }

  private async sendEmailIfPossible(notification: Notification) {
    if (!this.transporter) return;

    const user = await this.userRepo.findOne({ where: { username: notification.recipient_username } });
    if (!user?.email) return;

    const from = this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('MAIL_USER');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Onco EHR');

    try {
      await this.emailJobsService.enqueue({
        to: user.email,
        subject: notification.title,
        html: buildNotificationEmail({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          actionUrl: notification.action_url,
          recipientName: user.first_name || user.username,
        }),
      });
      notification.email_sent = true;
      await this.notificationRepo.save(notification);
    } catch (error) {
      this.logger.error(`Failed to send email notification to ${user.email}: ${String(error)}`);
    }
  }
}

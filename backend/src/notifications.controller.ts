import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationChannel } from './entities';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Req() req: any) {
    return this.notificationsService.listForUser(req.user.username);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    return { unread: await this.notificationsService.getUnreadCount(req.user.username) };
  }

  @Patch(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notificationsService.markRead(id, req.user.username);
  }

  @Post('read-all')
  async markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.username);
  }

  @Post('test')
  async createTest(@Req() req: any, @Body() body: any) {
    return this.notificationsService.notify({
      recipientUsername: body.recipientUsername || req.user.username,
      title: body.title || 'Test notification',
      message: body.message || `This is a test notification from ${process.env.APP_NAME || 'TP Healthcare'}.`,
      type: body.type || 'info',
      category: body.category || 'manual',
      actionUrl: body.actionUrl || null,
      channel: body.channel || NotificationChannel.BOTH,
    });
  }
}

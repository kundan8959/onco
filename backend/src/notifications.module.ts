import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Notification, User } from './entities';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { EmailJobsService } from './email-jobs.service';
import { EMAIL_QUEUE } from './queue.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  providers: [NotificationsGateway, NotificationsService, EmailJobsService],
  controllers: [NotificationsController],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}

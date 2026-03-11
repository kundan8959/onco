import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { EMAIL_QUEUE } from './queue.constants';

@Processor(EMAIL_QUEUE)
export class EmailJobsProcessor extends WorkerHost {
  constructor(private notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'send-email') return null;
    const { to, subject, html } = job.data || {};
    const ok = await this.notificationsService.sendDirectEmail(to, subject, html);
    return { ok };
  }
}

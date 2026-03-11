import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EXPORT_QUEUE } from './queue.constants';

@Injectable()
export class ExportJobsService {
  constructor(
    @InjectQueue(EXPORT_QUEUE) private exportQueue: Queue,
    private configService: ConfigService,
  ) {}

  async enqueueAnalyticsExport(payload: any) {
    const job = await this.exportQueue.add('analytics-export', payload, {
      removeOnComplete: 20,
      removeOnFail: 50,
    });
    return { jobId: job.id, queued: true };
  }
}

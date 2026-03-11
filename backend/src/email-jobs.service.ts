import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE } from './queue.constants';

@Injectable()
export class EmailJobsService {
  constructor(@InjectQueue(EMAIL_QUEUE) private emailQueue: Queue) {}

  async enqueue(payload: any) {
    return this.emailQueue.add('send-email', payload, {
      removeOnComplete: 50,
      removeOnFail: 100,
    });
  }
}

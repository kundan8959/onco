import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { EXPORT_QUEUE } from './queue.constants';

@Processor(EXPORT_QUEUE)
export class ExportJobsProcessor extends WorkerHost {
  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'analytics-export') return null;
    const { rows = [], columns = [], filename = `analytics-export-${Date.now()}.csv` } = job.data || {};
    const csv = [columns, ...rows]
      .map((row: any[]) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const dir = join('/home/tec/.openclaw/workspace/repos/tpai/ehr_oncology_docker/backend', 'exports');
    await mkdir(dir, { recursive: true });
    const path = join(dir, filename);
    await writeFile(path, csv, 'utf8');
    return { path, filename };
  }
}

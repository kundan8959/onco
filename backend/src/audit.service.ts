import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async log(event: {
    actor?: string;
    actor_role?: string;
    action: string;
    entity_type: string;
    entity_id?: string | number | null;
    scope?: string | null;
    summary?: string | null;
    status?: string;
    metadata?: Record<string, any> | null;
  }) {
    const entry = this.auditRepo.create({
      actor: event.actor || 'system',
      actor_role: event.actor_role || 'system',
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id != null ? String(event.entity_id) : null,
      scope: event.scope || null,
      summary: event.summary || null,
      status: event.status || 'ok',
      metadata: event.metadata || null,
    });
    return this.auditRepo.save(entry);
  }

  async list(query: any) {
    const { search, status, entity_type, page = 1, page_size = 50 } = query;
    const qb = this.auditRepo.createQueryBuilder('audit').orderBy('audit.created_at', 'DESC');

    if (search) {
      qb.andWhere('(audit.actor ILIKE :s OR audit.action ILIKE :s OR audit.entity_type ILIKE :s OR audit.scope ILIKE :s OR audit.summary ILIKE :s)', { s: `%${search}%` });
    }
    if (status) qb.andWhere('audit.status = :status', { status });
    if (entity_type) qb.andWhere('audit.entity_type = :entity_type', { entity_type });

    qb.skip((Number(page) - 1) * Number(page_size)).take(Number(page_size));
    const [results, count] = await qb.getManyAndCount();
    return { count, results };
  }
}

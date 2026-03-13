import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalReport } from '../entities';

@Injectable()
export class MedicalReportsService {
  constructor(
    @InjectRepository(MedicalReport) private reportRepo: Repository<MedicalReport>,
  ) {}

  private getPageParams(query: any, defaultSize = 25) {
    const page = Math.max(1, Number(query?.page || 1));
    const page_size = Math.max(1, Math.min(200, Number(query?.page_size || defaultSize)));
    return { page, page_size, skip: (page - 1) * page_size };
  }

  async findAll(query: any, actor?: any) {
    const where: any = {};
    if (query.patient_id) where.patient_id = Number(query.patient_id);
    if (query.status) where.status = query.status;
    if (query.document_type) where.document_type = query.document_type;
    if (actor?.role === 'hospital' && actor?.hospital_name) where.hospital_name = actor.hospital_name;

    const { page, page_size, skip } = this.getPageParams(query, 25);
    const [rows, count] = await this.reportRepo.findAndCount({
      where,
      relations: ['patient'],
      order: { uploaded_at: 'DESC' },
      skip,
      take: page_size,
    });

    const results = rows.map((r) => ({
      ...r,
      patient_name: r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : null,
    }));

    return { count, page, page_size, results };
  }

  async findOne(id: number) {
    const report = await this.reportRepo.findOne({ where: { id }, relations: ['patient'] });
    if (!report) throw new NotFoundException('Medical report not found');
    return {
      ...report,
      patient_name: report.patient ? `${report.patient.first_name} ${report.patient.last_name}` : null,
    };
  }

  async create(data: Partial<MedicalReport> & { file?: any }, actor?: any) {
    const { file, ...rest } = data;
    const report = this.reportRepo.create({
      hospital_name: actor?.role === 'hospital' ? actor.hospital_name : (rest.hospital_name || actor?.hospital_name || null),
      ...rest,
    });
    if (file) {
      report.original_filename = file.originalname;
      report.file_path = file.path || file.filename || null;
    }
    return this.reportRepo.save(report);
  }

  async update(id: number, data: Partial<MedicalReport>) {
    await this.findOne(id);
    await this.reportRepo.update(id, data);
    return this.findOne(id);
  }

  async delete(id: number) {
    await this.findOne(id);
    await this.reportRepo.delete(id);
  }

  async approve(id: number) {
    await this.findOne(id);
    await this.reportRepo.update(id, { status: 'approved' });
    return this.findOne(id);
  }

  async reject(id: number, reason?: string) {
    await this.findOne(id);
    await this.reportRepo.update(id, { status: 'rejected', rejection_reason: reason || null });
    return this.findOne(id);
  }

  async retry(id: number) {
    await this.findOne(id);
    await this.reportRepo.update(id, { status: 'pending' });
    return this.findOne(id);
  }
}

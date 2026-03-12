import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OncologyRecord, OncologyTreatment, OncologyFollowUp,
  OncologySymptomReport, OncologyPayerSubmission, NotificationChannel,
} from '../entities';
import { NotificationsService } from '../notifications.service';
import { AuditService } from '../audit.service';

@Injectable()
export class OncologyService {
  private readonly allowedCancerTypes = new Set([
    'Breast Cancer',
    'Prostate Cancer',
    'Lung Cancer',
    'Colorectal Cancer',
  ]);

  private assertHospitalAccess(entity: any, actor?: any) {
    if (actor?.role === 'hospital' && actor?.hospital_name && entity?.hospital_name !== actor.hospital_name) {
      throw new NotFoundException('Record not found');
    }
  }

  private getPageParams(query: any, defaultSize = 25) {
    const page = Math.max(1, Number(query?.page || 1));
    const page_size = Math.max(1, Math.min(200, Number(query?.page_size || defaultSize)));
    return { page, page_size, skip: (page - 1) * page_size };
  }

  private async paginate(repo: Repository<any>, options: any, query: any, defaultSize = 25, map?: (item: any) => Promise<any> | any) {
    const { page, page_size, skip } = this.getPageParams(query, defaultSize);
    const [results, count] = await repo.findAndCount({ ...options, skip, take: page_size });
    const mapped = map ? await Promise.all(results.map(map)) : results;
    return { count, page, page_size, results: mapped };
  }

  constructor(
    @InjectRepository(OncologyRecord) private recordRepo: Repository<OncologyRecord>,
    @InjectRepository(OncologyTreatment) private treatmentRepo: Repository<OncologyTreatment>,
    @InjectRepository(OncologyFollowUp) private followupRepo: Repository<OncologyFollowUp>,
    @InjectRepository(OncologySymptomReport) private symptomRepo: Repository<OncologySymptomReport>,
    @InjectRepository(OncologyPayerSubmission) private payerRepo: Repository<OncologyPayerSubmission>,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  private normalizeCancerType(value?: string) {
    if (!value) return value;
    const normalized = String(value).trim();
    if (!this.allowedCancerTypes.has(normalized)) {
      throw new BadRequestException(`Unsupported cancer type. Allowed: ${[...this.allowedCancerTypes].join(', ')}`);
    }
    return normalized;
  }

  // ===== ONCOLOGY RECORDS =====
  async findAllRecords(query: any, actor?: any) {
    const { search, page = 1, page_size = 25 } = query;
    const qb = this.recordRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.patient', 'p');

    if (query.patient_id) qb.andWhere('r.patient_id = :patient_id', { patient_id: query.patient_id });
    if (query.status) qb.andWhere('r.status = :status', { status: query.status });
    if (query.cancer_type) qb.andWhere('r.cancer_type = :cancer_type', { cancer_type: this.normalizeCancerType(query.cancer_type) });
    if (actor?.role === 'hospital' && actor?.hospital_name) qb.andWhere('r.hospital_name = :hospital_name', { hospital_name: actor.hospital_name });
    if (search) {
      qb.andWhere(
        '(p.first_name ILIKE :s OR p.last_name ILIKE :s OR p.email ILIKE :s OR p.contact_number ILIKE :s OR p.medical_record_number ILIKE :s OR r.cancer_type ILIKE :s OR r.clinical_stage ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    qb.orderBy('r.diagnosis_date', 'DESC');
    qb.skip((Math.max(1, Number(page)) - 1) * Math.max(1, Number(page_size))).take(Math.max(1, Math.min(200, Number(page_size))));

    const [results, count] = await qb.getManyAndCount();
    const mapped = await Promise.all(results.map(async (r: any) => {
      const treatments = await this.treatmentRepo.find({
        where: { oncology_record_id: r.id },
        order: { start_date: 'DESC' },
      });
      const hasActiveTreatment = treatments.some((t) => !t.end_date);
      return {
        ...r,
        tnm_staging: r.tnm_staging,
        has_active_treatment: hasActiveTreatment,
        needs_treatment_warning: r.status === 'active' && !hasActiveTreatment && r.diagnosis_confirmed,
        patient_name: r.patient?.full_name,
      };
    }));

    return {
      count,
      page: Math.max(1, Number(page)),
      page_size: Math.max(1, Math.min(200, Number(page_size))),
      results: mapped,
    };
  }

  async findOneRecord(id: number) {
    const record = await this.recordRepo.findOne({ where: { id }, relations: ['patient'] });
    if (!record) throw new NotFoundException('Oncology record not found');

    const [treatments, followups, symptoms, payerSubmissions] = await Promise.all([
      this.treatmentRepo.find({ where: { oncology_record_id: id }, order: { start_date: 'DESC' } }),
      this.followupRepo.find({ where: { oncology_record_id: id }, order: { followup_date: 'DESC' } }),
      this.symptomRepo.find({ where: { oncology_record_id: id }, order: { reported_date: 'DESC' } }),
      this.payerRepo.find({ where: { oncology_record_id: id }, order: { submission_date: 'DESC' } }),
    ]);

    const hasActiveTreatment = treatments.some(t => !t.end_date);

    return {
      ...record,
      tnm_staging: record.tnm_staging,
      has_active_treatment: hasActiveTreatment,
      needs_treatment_warning: record.status === 'active' && !hasActiveTreatment && record.diagnosis_confirmed,
      patient_name: record.patient?.full_name,
      treatments,
      followups,
      symptom_reports: symptoms,
      payer_submissions: payerSubmissions,
    };
  }

  async createRecord(data: Partial<OncologyRecord>, actor?: any) {
    const payload = {
      ...data,
      hospital_name: actor?.role === 'hospital' ? actor.hospital_name : (data.hospital_name || actor?.hospital_name || null),
      cancer_type: this.normalizeCancerType(data.cancer_type),
      confirmed_by: data.confirmed_by || 'pathology',
      stage_grouping_version: data.stage_grouping_version || 'AJCC 8th Edition',
      roadmap_generated_at: new Date(),
    };
    const record = this.recordRepo.create(payload);
    const saved = await this.recordRepo.save(record);
    await this.notificationsService.notifyMany(['superadmin', 'hospital', 'patient'], {
      title: 'New oncology record created',
      message: `${saved.cancer_type} record created with status ${saved.status}.`,
      type: 'success',
      category: 'oncology',
      actionUrl: `/hospital/oncology-records`,
      channel: NotificationChannel.BOTH,
    });
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'create',
      entity_type: 'oncology_record',
      entity_id: saved.id,
      scope: saved.cancer_type,
      summary: `Created ${saved.cancer_type} oncology record`,
      metadata: { status: saved.status, patient_id: saved.patient_id },
    });
    return saved;
  }

  async updateRecord(id: number, data: Partial<OncologyRecord>, actor?: any) {
    const current = await this.recordRepo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Oncology record not found');
    this.assertHospitalAccess(current, actor);
    const payload = {
      ...data,
      cancer_type: data.cancer_type ? this.normalizeCancerType(data.cancer_type) : undefined,
    };
    await this.recordRepo.update(id, payload);
    const updated = await this.findOneRecord(id);
    await this.notificationsService.notifyMany(['superadmin', 'hospital', 'patient'], {
      title: 'Oncology record updated',
      message: `${updated.cancer_type} record updated${updated.clinical_stage ? ` · stage ${updated.clinical_stage}` : ''}.`,
      type: 'info',
      category: 'oncology',
      actionUrl: `/hospital/oncology-records`,
      channel: NotificationChannel.IN_APP,
    });
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'update',
      entity_type: 'oncology_record',
      entity_id: updated.id,
      scope: updated.cancer_type,
      summary: `Updated ${updated.cancer_type} oncology record`,
      metadata: { stage: updated.clinical_stage, patient_id: updated.patient_id },
    });
    return updated;
  }

  async deleteRecord(id: number, actor?: any) {
    const record = await this.recordRepo.findOne({ where: { id } });
    if (record) this.assertHospitalAccess(record, actor);
    await this.recordRepo.delete(id);
    if (record) {
      await this.auditService.log({
        action: 'delete',
        entity_type: 'oncology_record',
        entity_id: id,
        scope: record.cancer_type,
        summary: `Deleted ${record.cancer_type} oncology record`,
        metadata: { patient_id: record.patient_id },
      });
    }
  }

  // ===== TREATMENTS =====
  async findAllTreatments(query: any, actor?: any) {
    const where: any = {};
    if (query.oncology_record_id) where.oncology_record_id = query.oncology_record_id;
    if (query.treatment_type) where.treatment_type = query.treatment_type;
    if (query.response) where.response = query.response;
    if (actor?.role === 'hospital' && actor?.hospital_name) where.hospital_name = actor.hospital_name;
    return this.paginate(this.treatmentRepo, { where, relations: ['oncology_record', 'oncology_record.patient'], order: { start_date: 'DESC' } }, query);
  }

  async createTreatment(data: Partial<OncologyTreatment>, actor?: any) {
    const treatment = this.treatmentRepo.create({ readiness_status: 'ready', hospital_name: actor?.role === 'hospital' ? actor.hospital_name : (data.hospital_name || actor?.hospital_name || null), ...data });
    const saved = await this.treatmentRepo.save(treatment);
    const record = await this.recordRepo.findOne({ where: { id: saved.oncology_record_id }, relations: ['patient'] });
    const patient = record?.patient;
    const patientName = patient?.full_name || 'Patient';
    await this.notificationsService.notifyMany(['hospital', 'patient'], {
      title: 'Treatment scheduled',
      message: `${saved.regimen_name || saved.treatment_type} was scheduled for ${patientName} starting ${saved.start_date}.`,
      type: 'success',
      category: 'treatment',
      actionUrl: `/hospital/chemo-schedule`,
      channel: NotificationChannel.BOTH,
    });
    if (patient?.emergency_contact_email) {
      await this.notificationsService.sendDirectEmail(
        patient.emergency_contact_email,
        `Treatment scheduled for ${patientName}`,
        `<div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Treatment scheduled</h2>
          <p>${saved.regimen_name || saved.treatment_type} has been scheduled for ${patientName} starting ${saved.start_date}.</p>
          <p>Emergency contact on file: ${patient.emergency_contact_name_relation || 'Registered contact'}.</p>
        </div>`,
      );
    }
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'create',
      entity_type: 'treatment',
      entity_id: saved.id,
      scope: patientName,
      summary: `Created treatment ${saved.regimen_name || saved.treatment_type} for ${patientName}`,
      metadata: { oncology_record_id: saved.oncology_record_id, start_date: saved.start_date, response: saved.response, readiness_status: saved.readiness_status },
    });
    return saved;
  }

  async updateTreatment(id: number, data: Partial<OncologyTreatment>, actor?: any) {
    const current = await this.treatmentRepo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Treatment not found');
    this.assertHospitalAccess(current, actor);
    await this.treatmentRepo.update(id, data);
    const saved = await this.treatmentRepo.findOne({ where: { id } });
    if (saved) {
      await this.auditService.log({
        actor: actor?.username || 'system',
        actor_role: actor?.role || 'system',
        action: 'update',
        entity_type: 'treatment',
        entity_id: saved.id,
        scope: saved.regimen_name || saved.treatment_type,
        summary: `Updated treatment ${saved.regimen_name || saved.treatment_type}`,
        metadata: { oncology_record_id: saved.oncology_record_id, start_date: saved.start_date, end_date: saved.end_date, response: saved.response, readiness_status: saved.readiness_status },
      });
    }
    return saved;
  }

  async deleteTreatment(id: number, actor?: any) {
    const treatment = await this.treatmentRepo.findOne({ where: { id } });
    if (treatment) this.assertHospitalAccess(treatment, actor);
    await this.treatmentRepo.delete(id);
    if (treatment) {
      await this.auditService.log({
        action: 'delete',
        entity_type: 'treatment',
        entity_id: id,
        scope: treatment.regimen_name || treatment.treatment_type,
        summary: `Deleted treatment ${treatment.regimen_name || treatment.treatment_type}`,
        metadata: { oncology_record_id: treatment.oncology_record_id },
      });
    }
  }

  async rescheduleTreatment(id: number, start_date: string, notes?: string) {
    const treatment = await this.treatmentRepo.findOne({ where: { id } });
    if (!treatment) throw new NotFoundException('Treatment not found');
    treatment.start_date = start_date;
    treatment.response = 'monitoring';
    treatment.notes = [treatment.notes, notes].filter(Boolean).join('\n').trim() || treatment.notes;
    const saved = await this.treatmentRepo.save(treatment);
    await this.auditService.log({
      action: 'reschedule',
      entity_type: 'treatment',
      entity_id: saved.id,
      scope: saved.regimen_name || saved.treatment_type,
      summary: `Rescheduled treatment to ${saved.start_date}`,
      metadata: { oncology_record_id: saved.oncology_record_id, start_date: saved.start_date },
    });
    return saved;
  }

  async completeTreatment(id: number, end_date?: string, notes?: string) {
    const treatment = await this.treatmentRepo.findOne({ where: { id } });
    if (!treatment) throw new NotFoundException('Treatment not found');
    treatment.end_date = end_date || new Date().toISOString().slice(0, 10);
    treatment.response = 'improving';
    treatment.notes = [treatment.notes, notes].filter(Boolean).join('\n').trim() || treatment.notes;
    const saved = await this.treatmentRepo.save(treatment);
    await this.auditService.log({
      action: 'complete',
      entity_type: 'treatment',
      entity_id: saved.id,
      scope: saved.regimen_name || saved.treatment_type,
      summary: `Completed treatment on ${saved.end_date}`,
      metadata: { oncology_record_id: saved.oncology_record_id, end_date: saved.end_date },
    });
    return saved;
  }

  async delayTreatment(id: number, notes?: string, actor?: any) {
    const treatment = await this.treatmentRepo.findOne({ where: { id } });
    if (!treatment) throw new NotFoundException('Treatment not found');
    treatment.response = 'monitoring';
    treatment.readiness_status = 'patient_confirmed';
    treatment.notes = [treatment.notes, notes || 'Treatment delayed'].filter(Boolean).join('\n').trim() || treatment.notes;
    const saved = await this.treatmentRepo.save(treatment);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'delay',
      entity_type: 'treatment',
      entity_id: saved.id,
      scope: saved.regimen_name || saved.treatment_type,
      summary: 'Marked treatment as delayed',
      metadata: { oncology_record_id: saved.oncology_record_id, readiness_status: saved.readiness_status },
      status: 'pending',
    });
    return saved;
  }

  async setTreatmentReadiness(id: number, readiness_status: string, actor?: any) {
    const treatment = await this.treatmentRepo.findOne({ where: { id } });
    if (!treatment) throw new NotFoundException('Treatment not found');
    treatment.readiness_status = readiness_status;
    const saved = await this.treatmentRepo.save(treatment);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'readiness_update',
      entity_type: 'treatment',
      entity_id: saved.id,
      scope: saved.regimen_name || saved.treatment_type,
      summary: `Updated treatment readiness to ${readiness_status}`,
      metadata: { oncology_record_id: saved.oncology_record_id, readiness_status },
    });
    return saved;
  }

  async setPayerStatus(id: number, claim_status: string, actor?: any) {
    const payer = await this.payerRepo.findOne({ where: { id } });
    if (!payer) throw new NotFoundException('Payer submission not found');
    this.assertHospitalAccess(payer, actor);
    payer.claim_status = claim_status;
    const saved = await this.payerRepo.save(payer);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'status_update',
      entity_type: 'payer_submission',
      entity_id: saved.id,
      scope: saved.insurance_company,
      summary: `Updated payer status to ${claim_status}`,
      metadata: { authorization_status: saved.authorization_status, claim_status },
    });
    return saved;
  }

  async setSymptomState(id: number, payload: any, actor?: any) {
    const symptom = await this.symptomRepo.findOne({ where: { id } });
    if (!symptom) throw new NotFoundException('Symptom report not found');
    this.assertHospitalAccess(symptom, actor);
    if (payload.severity) symptom.severity = payload.severity;
    if (payload.progression) symptom.progression = payload.progression;
    if (payload.notes) symptom.notes = [symptom.notes, payload.notes].filter(Boolean).join('\n').trim() || symptom.notes;
    const saved = await this.symptomRepo.save(symptom);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'state_update',
      entity_type: 'symptom',
      entity_id: saved.id,
      scope: `record:${saved.oncology_record_id}`,
      summary: `Updated symptom ${saved.symptom_name}`,
      metadata: { severity: saved.severity, progression: saved.progression },
    });
    return saved;
  }

  // ===== FOLLOW-UPS =====
  async findAllFollowups(query: any) {
    const where: any = {};
    if (query.oncology_record_id) where.oncology_record_id = query.oncology_record_id;
    return this.paginate(this.followupRepo, { where, order: { followup_date: 'DESC' } }, query);
  }

  async createFollowup(data: Partial<OncologyFollowUp>) {
    const followup = this.followupRepo.create(data);
    return this.followupRepo.save(followup);
  }

  async updateFollowup(id: number, data: Partial<OncologyFollowUp>) {
    await this.followupRepo.update(id, data);
    return this.followupRepo.findOne({ where: { id } });
  }

  async deleteFollowup(id: number) {
    await this.followupRepo.delete(id);
  }

  // ===== SYMPTOM REPORTS =====
  async findAllSymptoms(query: any) {
    const where: any = {};
    if (query.oncology_record_id) where.oncology_record_id = query.oncology_record_id;
    return this.paginate(this.symptomRepo, { where, relations: ['oncology_record', 'oncology_record.patient'], order: { reported_date: 'DESC' } }, query);
  }

  async createSymptom(data: Partial<OncologySymptomReport>, actor?: any) {
    const payload = {
      ...data,
      hospital_name: actor?.role === 'hospital' ? actor.hospital_name : (data.hospital_name || actor?.hospital_name || null),
      onset_date: data.onset_date || data.reported_date || new Date().toISOString().slice(0, 10),
      reported_date: data.reported_date || new Date().toISOString().slice(0, 10),
    };
    const s = this.symptomRepo.create(payload);
    const saved = await this.symptomRepo.save(s);
    await this.auditService.log({
      action: 'create',
      entity_type: 'symptom',
      entity_id: saved.id,
      scope: `record:${saved.oncology_record_id}`,
      summary: `Created symptom ${saved.symptom_name}`,
      metadata: { severity: saved.severity, progression: saved.progression },
    });
    return saved;
  }

  async updateSymptom(id: number, data: Partial<OncologySymptomReport>, actor?: any) {
    const current = await this.symptomRepo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Symptom report not found');
    this.assertHospitalAccess(current, actor);
    await this.symptomRepo.update(id, data);
    const saved = await this.symptomRepo.findOne({ where: { id } });
    if (saved) {
      await this.auditService.log({
        action: 'update',
        entity_type: 'symptom',
        entity_id: saved.id,
        scope: `record:${saved.oncology_record_id}`,
        summary: `Updated symptom ${saved.symptom_name}`,
        metadata: { severity: saved.severity, progression: saved.progression },
      });
    }
    return saved;
  }

  async deleteSymptom(id: number, actor?: any) {
    const symptom = await this.symptomRepo.findOne({ where: { id } });
    if (symptom) this.assertHospitalAccess(symptom, actor);
    await this.symptomRepo.delete(id);
    if (symptom) {
      await this.auditService.log({
        action: 'delete',
        entity_type: 'symptom',
        entity_id: id,
        scope: `record:${symptom.oncology_record_id}`,
        summary: `Deleted symptom ${symptom.symptom_name}`,
        metadata: { severity: symptom.severity },
      });
    }
  }

  // ===== PAYER SUBMISSIONS =====
  async findAllPayer(query: any) {
    const where: any = {};
    if (query.oncology_record_id) where.oncology_record_id = query.oncology_record_id;
    if (query.claim_status) where.claim_status = query.claim_status;
    return this.paginate(this.payerRepo, { where, relations: ['oncology_record', 'oncology_record.patient'], order: { submission_date: 'DESC' } }, query);
  }

  async createPayer(data: Partial<OncologyPayerSubmission>, actor?: any) {
    const payload = {
      ...data,
      hospital_name: actor?.role === 'hospital' ? actor.hospital_name : (data.hospital_name || actor?.hospital_name || null),
      primary_or_secondary: data.primary_or_secondary || 'primary',
      icd10_diagnosis_code: data.icd10_diagnosis_code || 'C80.1',
      cpt_codes: data.cpt_codes || [],
      hcpcs_codes: data.hcpcs_codes || [],
      authorization_status: data.authorization_status || 'not_required',
      claim_status: data.claim_status || 'submitted',
      submission_date: data.submission_date || new Date().toISOString().slice(0, 10),
    };
    const p = this.payerRepo.create(payload);
    const saved = await this.payerRepo.save(p);
    await this.auditService.log({
      action: 'create',
      entity_type: 'payer_submission',
      entity_id: saved.id,
      scope: saved.insurance_company,
      summary: `Created payer submission for ${saved.insurance_company}`,
      metadata: { claim_status: saved.claim_status, authorization_status: saved.authorization_status },
    });
    return saved;
  }

  async updatePayer(id: number, data: Partial<OncologyPayerSubmission>, actor?: any) {
    const current = await this.payerRepo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Payer submission not found');
    this.assertHospitalAccess(current, actor);
    await this.payerRepo.update(id, data);
    const saved = await this.payerRepo.findOne({ where: { id } });
    if (saved) {
      await this.auditService.log({
        action: 'update',
        entity_type: 'payer_submission',
        entity_id: saved.id,
        scope: saved.insurance_company,
        summary: `Updated payer submission for ${saved.insurance_company}`,
        metadata: { claim_status: saved.claim_status, authorization_status: saved.authorization_status },
      });
    }
    return saved;
  }

  async deletePayer(id: number, actor?: any) {
    const payer = await this.payerRepo.findOne({ where: { id } });
    if (payer) this.assertHospitalAccess(payer, actor);
    await this.payerRepo.delete(id);
    if (payer) {
      await this.auditService.log({
        action: 'delete',
        entity_type: 'payer_submission',
        entity_id: id,
        scope: payer.insurance_company,
        summary: `Deleted payer submission for ${payer.insurance_company}`,
        metadata: { claim_status: payer.claim_status },
      });
    }
  }
}

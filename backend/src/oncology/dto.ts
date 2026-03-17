import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateOncologyRecordDto {
  @IsInt() patient_id: number;
  @IsString() @IsNotEmpty() cancer_type: string;
  @IsDateString() diagnosis_date: string;
  @IsOptional() @IsBoolean() diagnosis_confirmed?: boolean;
  @IsOptional() @IsString() clinical_stage?: string;
  @IsOptional() @IsString() treatment_intent?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() hospital_name?: string;
  // Diagnosis detail
  @IsOptional() @IsString() other_cancer_type_details?: string;
  @IsOptional() @IsString() icd10_code?: string;
  @IsOptional() @IsString() confirmed_by?: string;
  @IsOptional() @IsNumber() ai_confidence_score?: number;
  @IsOptional() @IsString() pathology_report_notes?: string;
  // Staging
  @IsOptional() @IsString() t_stage?: string;
  @IsOptional() @IsString() n_stage?: string;
  @IsOptional() @IsString() m_stage?: string;
  @IsOptional() @IsString() stage_grouping_version?: string;
  // Tumor characteristics
  @IsOptional() @IsString() grade?: string;
  @IsOptional() @IsString() histology_type?: string;
  @IsOptional() @IsNumber() tumor_size_cm?: number;
  @IsOptional() @IsBoolean() lymph_node_involvement?: boolean;
  @IsOptional() @IsBoolean() metastasis_present?: boolean;
  @IsOptional() @IsObject() biomarkers?: Record<string, any>;
  // Clinical assessment
  @IsOptional() @IsInt() ecog_performance_status?: number;
  @IsOptional() @IsString() comorbidities?: string;
  @IsOptional() @IsString() supporting_lab_results?: string;
  @IsOptional() @IsString() imaging_findings?: string;
  @IsOptional() @IsString() clinical_notes?: string;
  // Treatment roadmap
  @IsOptional() @IsString() recommended_surgery?: string;
  @IsOptional() @IsString() recommended_chemotherapy?: string;
  @IsOptional() @IsString() recommended_radiation?: string;
  @IsOptional() @IsString() recommended_immunotherapy?: string;
  @IsOptional() @IsString() recommended_targeted_therapy?: string;
  @IsOptional() @IsString() urgency_level?: string;
  // Misc
  @IsOptional() @IsBoolean() is_primary?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateOncologyRecordDto {
  @IsOptional() @IsInt() patient_id?: number;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsString() cancer_type?: string;
  @IsOptional() @IsString() other_cancer_type_details?: string;
  @IsOptional() @IsString() icd10_code?: string;
  @IsOptional() @IsDateString() diagnosis_date?: string;
  @IsOptional() @IsBoolean() diagnosis_confirmed?: boolean;
  @IsOptional() @IsString() confirmed_by?: string;
  @IsOptional() @IsNumber() ai_confidence_score?: number;
  @IsOptional() @IsString() pathology_report_notes?: string;
  @IsOptional() @IsString() t_stage?: string;
  @IsOptional() @IsString() n_stage?: string;
  @IsOptional() @IsString() m_stage?: string;
  @IsOptional() @IsString() clinical_stage?: string;
  @IsOptional() @IsString() stage_grouping_version?: string;
  @IsOptional() @IsString() grade?: string;
  @IsOptional() @IsString() histology_type?: string;
  @IsOptional() @IsNumber() tumor_size_cm?: number;
  @IsOptional() @IsBoolean() lymph_node_involvement?: boolean;
  @IsOptional() @IsBoolean() metastasis_present?: boolean;
  @IsOptional() @IsObject() biomarkers?: Record<string, any>;
  @IsOptional() @IsInt() ecog_performance_status?: number;
  @IsOptional() @IsString() comorbidities?: string;
  @IsOptional() @IsString() supporting_lab_results?: string;
  @IsOptional() @IsString() imaging_findings?: string;
  @IsOptional() @IsString() clinical_notes?: string;
  @IsOptional() @IsString() recommended_surgery?: string;
  @IsOptional() @IsString() recommended_chemotherapy?: string;
  @IsOptional() @IsString() recommended_radiation?: string;
  @IsOptional() @IsString() recommended_immunotherapy?: string;
  @IsOptional() @IsString() recommended_targeted_therapy?: string;
  @IsOptional() @IsString() treatment_intent?: string;
  @IsOptional() @IsString() urgency_level?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() is_primary?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class CreateTreatmentDto {
  @IsInt() oncology_record_id: number;
  @IsString() @IsNotEmpty() treatment_type: string;
  @IsOptional() @IsString() regimen_name?: string;
  @IsDateString() start_date: string;
  @IsOptional() @IsString() response?: string;
  @IsOptional() @IsString() hospital_name?: string;
}

export class UpdateTreatmentDto {
  @IsOptional() @IsInt() oncology_record_id?: number;
  @IsOptional() @IsInt() patient_id?: number;
  @IsOptional() @IsString() treatment_type?: string;
  @IsOptional() @IsString() regimen_name?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() end_date?: string;
  @IsOptional() @IsString() response?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() readiness_status?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateSymptomDto {
  @IsInt() oncology_record_id: number;
  @IsString() @IsNotEmpty() symptom_name: string;
  @IsString() @IsNotEmpty() severity: string;
  @IsOptional() @IsDateString() onset_date?: string;
  @IsOptional() @IsString() progression?: string;
  @IsOptional() @IsNumber() pain_score?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsDateString() reported_date?: string;
}

export class UpdateSymptomDto {
  @IsOptional() @IsInt() oncology_record_id?: number;
  @IsOptional() @IsString() symptom_name?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsDateString() onset_date?: string;
  @IsOptional() @IsString() progression?: string;
  @IsOptional() @IsNumber() pain_score?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsDateString() reported_date?: string;
}

export class CreatePayerDto {
  @IsInt() oncology_record_id: number;
  @IsString() @IsNotEmpty() insurance_company: string;
  @IsString() @IsNotEmpty() policy_number: string;
  @IsString() @IsNotEmpty() claim_type: string;
  @IsOptional() @IsString() claim_status?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsString() primary_or_secondary?: string;
  @IsOptional() @IsString() icd10_diagnosis_code?: string;
  @IsOptional() @IsString() authorization_status?: string;
  @IsOptional() @IsString() authorization_number?: string;
  @IsOptional() @IsString() claim_number?: string;
  @IsOptional() @IsDateString() submission_date?: string;
  @IsOptional() @IsNumber() billed_amount?: number;
  @IsOptional() @IsNumber() approved_amount?: number;
  @IsOptional() @IsArray() cpt_codes?: string[];
  @IsOptional() @IsArray() hcpcs_codes?: string[];
  @IsOptional() @IsString() denial_reason?: string;
  @IsOptional() @IsBoolean() prior_authorization_required?: boolean;
  @IsOptional() @IsBoolean() resubmission_flag?: boolean;
  @IsOptional() @IsString() original_claim_number?: string;
  @IsOptional() @IsString() clearinghouse_name?: string;
}

export class UpdatePayerDto {
  @IsOptional() @IsInt() oncology_record_id?: number;
  @IsOptional() @IsInt() patient_id?: number;
  @IsOptional() @IsString() insurance_company?: string;
  @IsOptional() @IsString() policy_number?: string;
  @IsOptional() @IsString() claim_type?: string;
  @IsOptional() @IsString() claim_status?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsString() authorization_status?: string;
  @IsOptional() @IsString() authorization_number?: string;
  @IsOptional() @IsString() claim_number?: string;
  @IsOptional() @IsString() primary_or_secondary?: string;
  @IsOptional() @IsString() icd10_diagnosis_code?: string;
  @IsOptional() @IsDateString() submission_date?: string;
  @IsOptional() @IsNumber() billed_amount?: number;
  @IsOptional() @IsNumber() approved_amount?: number;
  @IsOptional() @IsArray() cpt_codes?: string[];
  @IsOptional() @IsArray() hcpcs_codes?: string[];
  @IsOptional() @IsString() denial_reason?: string;
  @IsOptional() @IsBoolean() prior_authorization_required?: boolean;
  @IsOptional() @IsBoolean() resubmission_flag?: boolean;
  @IsOptional() @IsString() original_claim_number?: string;
  @IsOptional() @IsString() clearinghouse_name?: string;
}

export class CreateFollowupDto {
  @IsInt() oncology_record_id: number;
  @IsDateString() followup_date: string;
  @IsOptional() @IsBoolean() recurrence_detected?: boolean;
  @IsOptional() @IsString() imaging_summary?: string;
  @IsOptional() @IsString() tumor_marker_summary?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateFollowupDto {
  @IsOptional() @IsInt() oncology_record_id?: number;
  @IsOptional() @IsDateString() followup_date?: string;
  @IsOptional() @IsBoolean() recurrence_detected?: boolean;
  @IsOptional() @IsString() imaging_summary?: string;
  @IsOptional() @IsString() tumor_marker_summary?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateEpisodeDto {
  @IsInt() oncology_record_id: number;
  @IsInt() patient_id: number;
  @IsString() @IsNotEmpty() episode_type: string;
  @IsDateString() scheduled_date: string;
  @IsOptional() @IsInt() oncology_treatment_id?: number;
  @IsOptional() @IsString() cancer_type?: string;
  @IsOptional() @IsString() scheduled_time?: string;
  @IsOptional() @IsInt() duration_minutes?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsInt() cycle_number?: number;
  @IsOptional() @IsInt() session_number?: number;
  @IsOptional() @IsInt() total_sessions?: number;
  @IsOptional() @IsString() pre_requirements?: string;
  @IsOptional() @IsString() attending_staff?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateEpisodeDto {
  @IsOptional() @IsString() episode_type?: string;
  @IsOptional() @IsDateString() scheduled_date?: string;
  @IsOptional() @IsString() scheduled_time?: string;
  @IsOptional() @IsInt() duration_minutes?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsInt() cycle_number?: number;
  @IsOptional() @IsInt() session_number?: number;
  @IsOptional() @IsInt() total_sessions?: number;
  @IsOptional() @IsString() pre_requirements?: string;
  @IsOptional() @IsString() attending_staff?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CancelEpisodeDto {
  @IsOptional() @IsString() cancellation_reason?: string;
}

export class TreatmentReadinessDto {
  @IsString() @IsNotEmpty() readiness_status: string;
}

export class SymptomStateDto {
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() progression?: string;
  @IsOptional() @IsString() notes?: string;
}

export class PayerStatusDto {
  @IsString() @IsNotEmpty() claim_status: string;
}

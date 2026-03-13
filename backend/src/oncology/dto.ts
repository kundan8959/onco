import { IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOncologyRecordDto {
  @IsInt() patient_id: number;
  @IsString() @IsNotEmpty() cancer_type: string;
  @IsDateString() diagnosis_date: string;
  @IsOptional() @IsBoolean() diagnosis_confirmed?: boolean;
  @IsOptional() @IsString() clinical_stage?: string;
  @IsOptional() @IsString() treatment_intent?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() hospital_name?: string;
}

export class UpdateOncologyRecordDto {
  @IsOptional() @IsString() cancer_type?: string;
  @IsOptional() @IsString() clinical_stage?: string;
  @IsOptional() @IsString() treatment_intent?: string;
  @IsOptional() @IsString() status?: string;
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
  @IsOptional() @IsString() treatment_type?: string;
  @IsOptional() @IsString() regimen_name?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() end_date?: string;
  @IsOptional() @IsString() response?: string;
  @IsOptional() @IsString() readiness_status?: string;
}

export class CreateSymptomDto {
  @IsInt() oncology_record_id: number;
  @IsString() @IsNotEmpty() symptom_name: string;
  @IsString() @IsNotEmpty() severity: string;
  @IsOptional() @IsString() progression?: string;
  @IsOptional() @IsString() hospital_name?: string;
}

export class UpdateSymptomDto {
  @IsOptional() @IsString() symptom_name?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() progression?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePayerDto {
  @IsInt() oncology_record_id: number;
  @IsString() @IsNotEmpty() insurance_company: string;
  @IsString() @IsNotEmpty() policy_number: string;
  @IsString() @IsNotEmpty() claim_type: string;
  @IsOptional() @IsString() claim_status?: string;
  @IsOptional() @IsString() hospital_name?: string;
}

export class UpdatePayerDto {
  @IsOptional() @IsString() insurance_company?: string;
  @IsOptional() @IsString() policy_number?: string;
  @IsOptional() @IsString() claim_type?: string;
  @IsOptional() @IsString() claim_status?: string;
  @IsOptional() @IsString() authorization_status?: string;
}

export class CreateFollowupDto {
  @IsInt() oncology_record_id: number;
  @IsDateString() followup_date: string;
  @IsOptional() @IsBoolean() recurrence_detected?: boolean;
  @IsOptional() @IsString() imaging_summary?: string;
  @IsOptional() @IsString() tumor_marker_summary?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateFollowupDto {
  @IsOptional() @IsDateString() followup_date?: string;
  @IsOptional() @IsBoolean() recurrence_detected?: boolean;
  @IsOptional() @IsString() imaging_summary?: string;
  @IsOptional() @IsString() tumor_marker_summary?: string;
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

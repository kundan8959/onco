import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsDateString, IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString() @IsNotEmpty() medical_record_number: string;
  @IsString() @IsNotEmpty() first_name: string;
  @IsString() @IsNotEmpty() last_name: string;
  @IsDateString() date_of_birth: string;
  @IsString() @IsNotEmpty() gender: string;
  @IsString() @IsNotEmpty() blood_group: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @IsNotEmpty() contact_number: string;
  @IsString() @IsNotEmpty() street_address: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() state: string;
  @IsString() @IsNotEmpty() zip_code: string;
  @IsString() @IsNotEmpty() country: string;
  @IsOptional() @IsString() insurance_status?: string;
  @IsOptional() @IsString() hospital_name?: string;
}

export class UpdatePatientDto {
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsDateString() date_of_birth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() blood_group?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() contact_number?: string;
  @IsOptional() @IsString() street_address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zip_code?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() insurance_status?: string;
}

export class CreateVitalsDto {
  @IsInt() patient_id: number;
  @IsNumber() bp_systolic: number;
  @IsNumber() bp_diastolic: number;
  @IsNumber() diabetes: number;
  @IsNumber() spo2: number;
  @IsNumber() height: number;
  @IsNumber() weight: number;
  @IsOptional() @Type(() => Date) @IsDate() recorded_date?: Date;
}

export class UpdateVitalsDto {
  @IsOptional() @IsNumber() bp_systolic?: number;
  @IsOptional() @IsNumber() bp_diastolic?: number;
  @IsOptional() @IsNumber() diabetes?: number;
  @IsOptional() @IsNumber() spo2?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @Type(() => Date) @IsDate() recorded_date?: Date;
}

export class CreateMedicationDto {
  @IsInt() patient_id: number;
  @IsString() @IsNotEmpty() medicine_name: string;
  @IsString() @IsNotEmpty() dosage: string;
  @IsString() @IsNotEmpty() frequency: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateMedicationDto {
  @IsOptional() @IsString() medicine_name?: string;
  @IsOptional() @IsString() dosage?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() end_date?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class CreateAllergyDto {
  @IsInt() patient_id: number;
  @IsString() @IsNotEmpty() allergen: string;
  @IsOptional() @IsString() reaction?: string;
  @IsOptional() @IsString() severity?: string;
}

export class UpdateAllergyDto {
  @IsOptional() @IsString() allergen?: string;
  @IsOptional() @IsString() reaction?: string;
  @IsOptional() @IsString() severity?: string;
}

export class UpsertLifestyleDto {
  @IsInt() patient_id: number;
  @IsOptional() @IsString() smoking_status?: string;
  @IsOptional() @IsDateString() smoking_quit_date?: string;
  @IsOptional() @IsString() alcohol_use?: string;
  @IsOptional() @IsString() physical_activity?: string;
  @IsOptional() @IsString() exercise_type?: string;
  @IsOptional() @IsString() diet_type?: string;
  @IsOptional() @IsString() diet_notes?: string;
  @IsOptional() @IsNumber() sleep_hours?: number;
  @IsOptional() @IsString() sleep_quality?: string;
  @IsOptional() @IsString() stress_level?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpsertMedicalHistoryDto {
  @IsInt() patient_id: number;
  @IsOptional() @IsString() mother_condition?: string;
  @IsOptional() @IsString() mother_condition_other?: string;
  @IsOptional() @IsString() father_condition?: string;
  @IsOptional() @IsString() father_condition_other?: string;
  @IsOptional() @IsString() additional_family_history?: string;
}

export class CreateConditionDto {
  @IsInt() patient_id: number;
  @IsString() @IsNotEmpty() condition: string;
  @IsInt() diagnosed_year: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() diagnosed_by?: string;
  @IsOptional() @IsString() treatment?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateConditionDto {
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsInt() diagnosed_year?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() diagnosed_by?: string;
  @IsOptional() @IsString() treatment?: string;
  @IsOptional() @IsString() notes?: string;
}

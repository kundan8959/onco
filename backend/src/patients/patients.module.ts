import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Patient, Allergy, Vitals, Lifestyle, MedicalHistory,
  Medication, ChronicCondition, MedicalReport, User,
} from '../entities';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { MedicalReportsService } from './medical-reports.service';
import { MedicalReportsController } from './medical-reports.controller';
import { NotificationsModule } from '../notifications.module';
import { AuditService } from '../audit.service';
import { AuditLog } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient, Allergy, Vitals, Lifestyle, MedicalHistory,
      Medication, ChronicCondition, AuditLog, MedicalReport, User,
    ]),
    NotificationsModule,
  ],
  providers: [PatientsService, AuditService, MedicalReportsService],
  controllers: [PatientsController, MedicalReportsController],
  exports: [PatientsService],
})
export class PatientsModule {}

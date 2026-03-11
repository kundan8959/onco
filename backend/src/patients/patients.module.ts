import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Patient, Allergy, Vitals, Lifestyle, MedicalHistory,
  Medication, ChronicCondition,
} from '../entities';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { NotificationsModule } from '../notifications.module';
import { AuditService } from '../audit.service';
import { AuditLog } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient, Allergy, Vitals, Lifestyle, MedicalHistory,
      Medication, ChronicCondition, AuditLog,
    ]),
    NotificationsModule,
  ],
  providers: [PatientsService, AuditService],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}

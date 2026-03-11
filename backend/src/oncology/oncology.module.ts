import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OncologyRecord, OncologyTreatment, OncologyFollowUp,
  OncologySymptomReport, OncologyPayerSubmission,
} from '../entities';
import { OncologyService } from './oncology.service';
import { OncologyController } from './oncology.controller';
import { NotificationsModule } from '../notifications.module';
import { AuditService } from '../audit.service';
import { AuditLog } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OncologyRecord, OncologyTreatment, OncologyFollowUp,
      OncologySymptomReport, OncologyPayerSubmission, AuditLog,
    ]),
    NotificationsModule,
  ],
  providers: [OncologyService, AuditService],
  controllers: [OncologyController],
  exports: [OncologyService],
})
export class OncologyModule {}

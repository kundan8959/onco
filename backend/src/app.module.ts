import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { PatientsModule } from './patients/patients.module';
import { OncologyModule } from './oncology/oncology.module';
import { HealthController } from './health.controller';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';
import { AppSeedService } from './app.seed';
import { NotificationsModule } from './notifications.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { ExportsController } from './exports.controller';
import { ExportJobsService } from './export-jobs.service';
import { ExportJobsProcessor } from './export-jobs.processor';
import { EmailJobsService } from './email-jobs.service';
import { EmailJobsProcessor } from './email-jobs.processor';
import { EMAIL_QUEUE, EXPORT_QUEUE } from './queue.constants';
import {
  Patient,
  Allergy,
  Vitals,
  Lifestyle,
  MedicalHistory,
  Medication,
  ChronicCondition,
  OncologyRecord,
  OncologyTreatment,
  OncologyFollowUp,
  OncologySymptomReport,
  OncologyPayerSubmission,
  User,
  Notification,
  AuditLog,
} from './entities';
import { TreatmentEpisode, MedicalReport } from './entities';

const ENTITIES = [
  Patient,
  Allergy,
  Vitals,
  Lifestyle,
  MedicalHistory,
  Medication,
  ChronicCondition,
  OncologyRecord,
  OncologyTreatment,
  OncologyFollowUp,
  OncologySymptomReport,
  OncologyPayerSubmission,
  TreatmentEpisode,
  MedicalReport,
  User,
  Notification,
  AuditLog,
];

@Module({
  controllers: [HealthController, OverviewController, AuditController, AdminUsersController, ExportsController],
  providers: [OverviewService, AppSeedService, AuditService, AdminUsersService, ExportJobsService, ExportJobsProcessor, EmailJobsService, EmailJobsProcessor],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', '127.0.0.1'),
          port: parseInt(config.get('REDIS_PORT', '6379'), 10),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: EMAIL_QUEUE },
      { name: EXPORT_QUEUE },
    ),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: parseInt(config.get('DB_PORT', '5432'), 10),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_NAME', 'oncology_ehr'),
        entities: ENTITIES,
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(ENTITIES),
    AuthModule,
    NotificationsModule,
    PatientsModule,
    OncologyModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private authService: AuthService,
    private appSeedService: AppSeedService,
  ) {}

  async onModuleInit() {
    await this.authService.createInitialAdmin();
    await this.appSeedService.seed();
  }
}

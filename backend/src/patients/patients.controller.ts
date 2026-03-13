import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Req,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { CreateAllergyDto, CreateConditionDto, CreateMedicationDto, CreatePatientDto, CreateVitalsDto, UpdateAllergyDto, UpdateConditionDto, UpdateMedicationDto, UpdatePatientDto, UpdateVitalsDto, UpsertLifestyleDto, UpsertMedicalHistoryDto } from './dto';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PatientsController {
  constructor(private readonly svc: PatientsService) {}

  // ===== DASHBOARD =====
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboardStats() {
    return this.svc.getDashboardStats();
  }

  // ===== PATIENTS =====
  @Get('patients')
  @ApiOperation({ summary: 'List patients with search/pagination' })
  findAllPatients(@Query() query: any, @Req() req: any) {
    return this.svc.findAllPatients(query, req.user);
  }

  @Get('patients/:id')
  @ApiOperation({ summary: 'Get patient detail with all related data' })
  findOnePatient(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.findOnePatient(id, req.user);
  }

  @Post('patients')
  @ApiOperation({ summary: 'Create patient' })
  createPatient(@Body() body: CreatePatientDto, @Req() req: any) {
    return this.svc.createPatient(body, req.user);
  }

  @Patch('patients/:id')
  @ApiOperation({ summary: 'Update patient' })
  updatePatient(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePatientDto, @Req() req: any) {
    return this.svc.updatePatient(id, body, req.user);
  }

  @Delete('patients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete patient' })
  deletePatient(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.deletePatient(id, req.user);
  }

  // ===== ALLERGIES =====
  @Get('allergies')
  @ApiOperation({ summary: 'List allergies' })
  findAllAllergies(@Query() query: any, @Req() req: any) {
    return this.svc.findAllAllergies(query, req.user);
  }

  @Post('allergies')
  @ApiOperation({ summary: 'Create allergy' })
  createAllergy(@Body() body: CreateAllergyDto) {
    return this.svc.createAllergy(body);
  }

  @Patch('allergies/:id')
  @ApiOperation({ summary: 'Update allergy' })
  updateAllergy(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAllergyDto) {
    return this.svc.updateAllergy(id, body);
  }

  @Delete('allergies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAllergy(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteAllergy(id);
  }

  // ===== VITALS =====
  @Get('vitals')
  @ApiOperation({ summary: 'List vitals' })
  findAllVitals(@Query() query: any, @Req() req: any) {
    return this.svc.findAllVitals(query, req.user);
  }

  @Post('vitals')
  @ApiOperation({ summary: 'Create vitals record' })
  createVitals(@Body() body: CreateVitalsDto, @Req() req: any) {
    return this.svc.createVitals(body, req.user);
  }

  @Patch('vitals/:id')
  @ApiOperation({ summary: 'Update vitals' })
  updateVitals(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateVitalsDto, @Req() req: any) {
    return this.svc.updateVitals(id, body, req.user);
  }

  @Delete('vitals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteVitals(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.deleteVitals(id, req.user);
  }

  // ===== LIFESTYLE =====
  @Get('lifestyle')
  @ApiOperation({ summary: 'List lifestyle records' })
  findAllLifestyle(@Query() query: any, @Req() req: any) {
    return this.svc.findAllLifestyle(query, req.user);
  }

  @Post('lifestyle')
  @ApiOperation({ summary: 'Create or update lifestyle (upsert)' })
  upsertLifestyle(@Body() body: UpsertLifestyleDto) {
    return this.svc.upsertLifestyle(body);
  }

  @Delete('lifestyle/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLifestyle(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteLifestyle(id);
  }

  // ===== MEDICAL HISTORY =====
  @Get('medical-history')
  @ApiOperation({ summary: 'List medical history records' })
  findAllMedicalHistory(@Query() query: any, @Req() req: any) {
    return this.svc.findAllMedicalHistory(query, req.user);
  }

  @Post('medical-history')
  @ApiOperation({ summary: 'Create or update medical history (upsert)' })
  upsertMedicalHistory(@Body() body: UpsertMedicalHistoryDto) {
    return this.svc.upsertMedicalHistory(body);
  }

  @Delete('medical-history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMedicalHistory(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteMedicalHistory(id);
  }

  // ===== MEDICATIONS =====
  @Get('medications')
  @ApiOperation({ summary: 'List medications' })
  findAllMedications(@Query() query: any, @Req() req: any) {
    return this.svc.findAllMedications(query, req.user);
  }

  @Post('medications')
  @ApiOperation({ summary: 'Create medication' })
  createMedication(@Body() body: CreateMedicationDto, @Req() req: any) {
    return this.svc.createMedication(body, req.user);
  }

  @Patch('medications/:id')
  @ApiOperation({ summary: 'Update medication' })
  updateMedication(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMedicationDto, @Req() req: any) {
    return this.svc.updateMedication(id, body, req.user);
  }

  @Delete('medications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMedication(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.deleteMedication(id, req.user);
  }

  // ===== CHRONIC CONDITIONS =====
  @Get('chronic-conditions')
  @ApiOperation({ summary: 'List chronic conditions' })
  findAllConditions(@Query() query: any, @Req() req: any) {
    return this.svc.findAllConditions(query, req.user);
  }

  @Post('chronic-conditions')
  @ApiOperation({ summary: 'Create chronic condition' })
  createCondition(@Body() body: CreateConditionDto) {
    return this.svc.createCondition(body);
  }

  @Patch('chronic-conditions/:id')
  @ApiOperation({ summary: 'Update chronic condition' })
  updateCondition(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateConditionDto) {
    return this.svc.updateCondition(id, body);
  }

  @Delete('chronic-conditions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCondition(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteCondition(id);
  }
}

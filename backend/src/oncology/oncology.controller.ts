import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OncologyService } from './oncology.service';
import { CreateFollowupDto, CreateOncologyRecordDto, CreatePayerDto, CreateSymptomDto, CreateTreatmentDto, PayerStatusDto, SymptomStateDto, TreatmentReadinessDto, UpdateFollowupDto, UpdateOncologyRecordDto, UpdatePayerDto, UpdateSymptomDto, UpdateTreatmentDto } from './dto';

@ApiTags('Oncology')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class OncologyController {
  constructor(private readonly svc: OncologyService) {}

  // ===== ONCOLOGY RECORDS =====
  @Get('oncology-records')
  @ApiOperation({ summary: 'List oncology records' })
  findAllRecords(@Query() query: any, @Req() req: any) {
    return this.svc.findAllRecords(query, req.user);
  }

  @Get('oncology-records/:id')
  @ApiOperation({ summary: 'Get oncology record detail' })
  findOneRecord(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneRecord(id);
  }

  @Post('oncology-records')
  @ApiOperation({ summary: 'Create oncology record' })
  createRecord(@Body() body: CreateOncologyRecordDto, @Req() req: any) {
    return this.svc.createRecord(body, req.user);
  }

  @Patch('oncology-records/:id')
  @ApiOperation({ summary: 'Update oncology record' })
  updateRecord(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateOncologyRecordDto, @Req() req: any) {
    return this.svc.updateRecord(id, body, req.user);
  }

  @Delete('oncology-records/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRecord(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.deleteRecord(id, req.user);
  }

  // ===== TREATMENTS =====
  @Get('oncology-treatments')
  @ApiOperation({ summary: 'List oncology treatments' })
  findAllTreatments(@Query() query: any, @Req() req: any) {
    return this.svc.findAllTreatments(query, req.user);
  }

  @Post('oncology-treatments')
  @ApiOperation({ summary: 'Create treatment' })
  createTreatment(@Body() body: CreateTreatmentDto, @Req() req: any) {
    return this.svc.createTreatment(body, req.user);
  }

  @Patch('oncology-treatments/:id')
  @ApiOperation({ summary: 'Update treatment' })
  updateTreatment(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateTreatmentDto, @Req() req: any) {
    return this.svc.updateTreatment(id, body, req.user);
  }

  @Delete('oncology-treatments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTreatment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.deleteTreatment(id, req.user);
  }

  @Post('oncology-treatments/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule treatment start date' })
  rescheduleTreatment(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.rescheduleTreatment(id, body.start_date, body.notes);
  }

  @Post('oncology-treatments/:id/complete')
  @ApiOperation({ summary: 'Mark treatment completed' })
  completeTreatment(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.completeTreatment(id, body.end_date, body.notes);
  }

  @Post('oncology-treatments/:id/delay')
  @ApiOperation({ summary: 'Mark treatment delayed' })
  delayTreatment(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    return this.svc.delayTreatment(id, body.notes, req.user);
  }

  @Post('oncology-treatments/:id/readiness')
  setTreatmentReadiness(@Param('id', ParseIntPipe) id: number, @Body() body: TreatmentReadinessDto, @Req() req: any) {
    return this.svc.setTreatmentReadiness(id, body.readiness_status, req.user);
  }

  @Post('payer-submissions/:id/status')
  setPayerStatus(@Param('id', ParseIntPipe) id: number, @Body() body: PayerStatusDto, @Req() req: any) {
    return this.svc.setPayerStatus(id, body.claim_status, req.user);
  }

  @Post('oncology-symptoms/:id/state')
  setSymptomState(@Param('id', ParseIntPipe) id: number, @Body() body: SymptomStateDto, @Req() req: any) {
    return this.svc.setSymptomState(id, body, req.user);
  }

  // ===== FOLLOW-UPS =====
  @Get('oncology-followups')
  @ApiOperation({ summary: 'List follow-ups' })
  findAllFollowups(@Query() query: any) {
    return this.svc.findAllFollowups(query);
  }

  @Post('oncology-followups')
  @ApiOperation({ summary: 'Create follow-up' })
  createFollowup(@Body() body: CreateFollowupDto) {
    return this.svc.createFollowup(body);
  }

  @Patch('oncology-followups/:id')
  @ApiOperation({ summary: 'Update follow-up' })
  updateFollowup(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateFollowupDto) {
    return this.svc.updateFollowup(id, body);
  }

  @Delete('oncology-followups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFollowup(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteFollowup(id);
  }

  // ===== SYMPTOM REPORTS =====
  @Get('oncology-symptoms')
  @ApiOperation({ summary: 'List symptom reports' })
  findAllSymptoms(@Query() query: any) {
    return this.svc.findAllSymptoms(query);
  }

  @Post('oncology-symptoms')
  @ApiOperation({ summary: 'Create symptom report' })
  createSymptom(@Body() body: CreateSymptomDto, @Req() req: any) {
    return this.svc.createSymptom(body, req.user);
  }

  @Patch('oncology-symptoms/:id')
  @ApiOperation({ summary: 'Update symptom report' })
  updateSymptom(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSymptomDto, @Req() req: any) {
    return this.svc.updateSymptom(id, body, req.user);
  }

  @Delete('oncology-symptoms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSymptom(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.deleteSymptom(id, req.user);
  }

  // ===== PAYER SUBMISSIONS =====
  @Get('payer-submissions')
  @ApiOperation({ summary: 'List payer submissions' })
  findAllPayer(@Query() query: any) {
    return this.svc.findAllPayer(query);
  }

  @Post('payer-submissions')
  @ApiOperation({ summary: 'Create payer submission' })
  createPayer(@Body() body: CreatePayerDto, @Req() req: any) {
    return this.svc.createPayer(body, req.user);
  }

  @Patch('payer-submissions/:id')
  @ApiOperation({ summary: 'Update payer submission' })
  updatePayer(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePayerDto, @Req() req: any) {
    return this.svc.updatePayer(id, body, req.user);
  }

  @Delete('payer-submissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePayer(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.deletePayer(id, req.user);
  }
}

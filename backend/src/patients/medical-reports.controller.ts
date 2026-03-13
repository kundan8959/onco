import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MedicalReportsService } from './medical-reports.service';

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'medical-reports'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('Medical Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('medical-reports')
export class MedicalReportsController {
  constructor(private readonly svc: MedicalReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List medical reports with pagination' })
  findAll(@Query() query: any, @Req() req: any) {
    return this.svc.findAll(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single medical report' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create/upload a medical report' })
  @UseInterceptors(FileInterceptor('document_file', { storage }))
  create(@UploadedFile() file: any, @Body() body: any, @Req() req: any) {
    const safeParseJson = (val: any) => {
      if (!val || typeof val !== 'string') return val;
      try { return JSON.parse(val); } catch { return val; }
    };

    const data: any = {
      patient_id: Number(body.patient) || undefined,
      document_type: body.document_type,
      status: body.status || 'pending',
      extracted_data: safeParseJson(body.extracted_data),
      insights: safeParseJson(body.insights),
      recommendations: safeParseJson(body.recommendations),
      ai_confidence_score: body.ai_confidence_score ? Number(body.ai_confidence_score) : undefined,
      file,
    };

    // Pull confidence from extracted_data if not explicitly provided
    if (!data.ai_confidence_score && data.extracted_data?.confidence_score) {
      data.ai_confidence_score = Number(data.extracted_data.confidence_score);
    }

    return this.svc.create(data, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a medical report' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a medical report' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a medical report' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.svc.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a medical report' })
  reject(@Param('id', ParseIntPipe) id: number, @Body('reason') reason?: string) {
    return this.svc.reject(id, reason);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry processing a medical report' })
  retry(@Param('id', ParseIntPipe) id: number) {
    return this.svc.retry(id);
  }
}

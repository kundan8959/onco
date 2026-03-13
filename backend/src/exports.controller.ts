import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ExportJobsService } from './export-jobs.service';

@ApiTags('Exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportJobsService: ExportJobsService) {}

  @Post('analytics')
  @ApiOperation({ summary: 'Queue analytics export job' })
  queueAnalyticsExport(@Body() body: any) {
    return this.exportJobsService.enqueueAnalyticsExport(body);
  }
}

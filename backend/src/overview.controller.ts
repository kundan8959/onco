import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { OverviewService } from './overview.service';

@Controller('overview')
@UseGuards(JwtAuthGuard)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('page')
  async getPage(@Query() query: any, @Req() req: any) {
    return this.overviewService.getPage(query.path, req.user, query);
  }
}

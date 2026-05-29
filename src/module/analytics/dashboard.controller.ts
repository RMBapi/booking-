import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';
import { BusinessId } from '../../common/decorators/business.decorator';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller()
export class DashboardController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/summary')
  @RequireFeature(FEATURES.VIEW_DASHBOARD)
  @ApiOperation({ summary: 'Dashboard summary stats (CRM)' })
  async summary(
    @BusinessId() businessId: string,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    const data = await this.analyticsService.getDashboardSummary(
      businessId,
      query.timezone,
      Boolean(query.includeCancelled),
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Dashboard summary fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('activity')
  @RequireFeature(FEATURES.VIEW_DASHBOARD)
  @ApiOperation({ summary: 'Recent activity feed (CRM)' })
  async activity(
    @BusinessId() businessId: string,
    @Query() query: ActivityQueryDto,
  ) {
    const data = await this.analyticsService.getActivity(businessId, query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Activity feed fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }
}

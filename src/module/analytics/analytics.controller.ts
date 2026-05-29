import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';
import { BusinessId } from '../../common/decorators/business.decorator';
import { AnalyticsSummaryQueryDto } from './dto/analytics-summary-query.dto';
import { AnalyticsTimeseriesQueryDto } from './dto/analytics-timeseries-query.dto';
import { AnalyticsBreakdownQueryDto } from './dto/analytics-breakdown-query.dto';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @RequireFeature(FEATURES.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Analytics KPI summary (CRM)' })
  async summary(
    @BusinessId() businessId: string,
    @Query() query: AnalyticsSummaryQueryDto,
  ) {
    const data = await this.analyticsService.getAnalyticsSummary(
      businessId,
      query.range,
      query.timezone,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Analytics summary fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('timeseries')
  @RequireFeature(FEATURES.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Analytics time series (CRM)' })
  async timeseries(
    @BusinessId() businessId: string,
    @Query() query: AnalyticsTimeseriesQueryDto,
  ) {
    const data = await this.analyticsService.getAnalyticsTimeseries(
      businessId,
      query,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Analytics timeseries fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('breakdown')
  @RequireFeature(FEATURES.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Analytics breakdown (CRM)' })
  async breakdown(
    @BusinessId() businessId: string,
    @Query() query: AnalyticsBreakdownQueryDto,
  ) {
    const data = await this.analyticsService.getAnalyticsBreakdown(
      businessId,
      query,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Analytics breakdown fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }
}

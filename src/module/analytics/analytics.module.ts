import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardController } from './dashboard.controller';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [DashboardController, AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

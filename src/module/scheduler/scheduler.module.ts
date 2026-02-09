import { Module } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { CommonModule } from '../../common/common.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [CommonModule, BusinessModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}

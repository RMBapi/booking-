import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { CommonModule } from '../../common/common.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [CommonModule, BusinessModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}

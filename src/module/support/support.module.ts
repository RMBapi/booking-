import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { CommonModule } from '../../common/common.module';
import { BusinessModule } from '../business/business.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [CommonModule, BusinessModule, MailModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}

import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { CommonModule } from '../../common/common.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [CommonModule, BusinessModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}

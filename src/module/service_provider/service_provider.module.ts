import { Module } from '@nestjs/common';
import { ServiceProviderController } from './service_provider.controller';
import { ServiceProviderService } from './service_provider.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ServiceProviderController],
  providers: [ServiceProviderService],
  exports: [ServiceProviderService],
})
export class ServiceProviderModule {}

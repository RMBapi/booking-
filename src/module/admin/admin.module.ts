import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../../database/database.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PermissionService } from './permissions.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [DatabaseModule],
  providers: [PermissionService, PermissionsGuard],
  exports: [PermissionService, PermissionsGuard],
})
export class PermissionsModule {}

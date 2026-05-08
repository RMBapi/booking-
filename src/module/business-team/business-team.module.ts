import { Module } from '@nestjs/common';
import { BusinessTeamController } from './business-team.controller';
import { BusinessTeamService } from './business-team.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessTeamController],
  providers: [BusinessTeamService],
  exports: [BusinessTeamService],
})
export class BusinessTeamModule {}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BusinessTeamService } from './business-team.service';
import { AddTeamMemberDto, UpdateTeamMemberDto } from './dto/team-dtos';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';

@ApiTags('Business Team')
@ApiBearerAuth('JWT-auth')
@Controller('business/:id/team')
export class BusinessTeamController {
  constructor(private readonly service: BusinessTeamService) {}

  @Get()
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({ summary: 'List business team members' })
  async list(@Param('id') businessId: string) {
    const data = await this.service.listMembers(businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Team members fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('available-features')
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({
    summary: 'List feature codes available for permission picker',
  })
  async features(@Param('id') _businessId: string) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Available features',
      timestamp: new Date().toISOString(),
      data: this.service.availableFeatures(),
    };
  }

  @Post()
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({
    summary: 'Add a team member directly (no email; owner sets the password)',
    description:
      'Creates the user account silently with the supplied password and adds them to the business with status="Pending". The owner shares the password out-of-band; the new member is forced to change it on first login. Status can later be changed via PATCH /business/:id/team/:userId.',
  })
  async add(
    @Param('id') businessId: string,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.service.addMember(businessId, dto, user.id);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Team member created in Pending status. Share the password securely with the user.',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Patch(':userId')
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({ summary: 'Update a team member role and/or permissions' })
  async update(
    @Param('id') businessId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.service.updateMember(
      businessId,
      userId,
      dto,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Team member updated',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({ summary: 'Remove a team member from the business' })
  async remove(
    @Param('id') businessId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.service.removeMember(businessId, userId, user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Team member removed',
      timestamp: new Date().toISOString(),
      data,
    };
  }
}

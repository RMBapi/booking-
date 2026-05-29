import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import {
  InvitationCreatedResponseDto,
  InvitationPublicViewDto,
  InvitationResponseDto,
} from './dto/invitation-response.dto';

@ApiTags('Invitations')
@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('business/:id/invitations')
  @ApiBearerAuth()
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({ summary: 'Invite a user to join a business by email' })
  @ApiResponse({ status: 201, type: InvitationCreatedResponseDto })
  async create(
    @Param('id') businessId: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: { id: string },
  ): Promise<InvitationCreatedResponseDto> {
    return this.invitationService.create(businessId, dto, user.id);
  }

  @Get('business/:id/invitations')
  @ApiBearerAuth()
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({ summary: 'List pending invitations for a business' })
  @ApiResponse({ status: 200, type: [InvitationResponseDto] })
  async list(
    @Param('id') businessId: string,
  ): Promise<InvitationResponseDto[]> {
    return this.invitationService.listPending(businessId);
  }

  @Delete('business/:id/invitations/:invitationId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @RequireFeature(FEATURES.MANAGE_TEAM)
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  async revoke(
    @Param('id') businessId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationService.revoke(businessId, invitationId, user.id);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Get('invitations/:token')
  @ApiOperation({ summary: 'Validate an invitation token (public)' })
  @ApiResponse({ status: 200, type: InvitationPublicViewDto })
  async view(@Param('token') token: string): Promise<InvitationPublicViewDto> {
    return this.invitationService.viewByToken(token);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('invitations/:token/accept')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept an invitation as the currently logged-in user',
  })
  async accept(
    @Param('token') token: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationService.acceptForUser(token, user.id);
  }
}

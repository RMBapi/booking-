import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { SupportTicketType } from '@prisma/client';
import { SupportService } from './support.service';
import { BusinessService } from '../business/business.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReplyTicketDto } from './dto/reply-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import {
  TicketDetailResponseDto,
  TicketResponseDto,
} from './dto/response/ticket-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';

const ok = (data: unknown, message: string, statusCode = HttpStatus.OK) => ({
  success: true,
  statusCode,
  message,
  timestamp: new Date().toISOString(),
  data,
});

@ApiTags('Support')
@ApiBearerAuth('JWT-auth')
@Controller('support')
export class SupportController {
  constructor(
    private readonly support: SupportService,
    private readonly businessService: BusinessService,
  ) {}

  // ────────────────────────────────────────────────────────────────────
  // Customer-facing — tenant Contact Us
  // ────────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('tickets')
  @ApiOperation({
    summary:
      'Submit a Contact-Us request for a business. Works logged-out (send name/email) or logged-in (subject/message only).',
  })
  @ApiResponse({ status: 201, type: TicketDetailResponseDto })
  async createBusinessTicket(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user?: JwtUser,
    @Headers('x-business-id') headerBusinessId?: string,
  ) {
    const businessId = await this.resolveBusinessId(
      headerBusinessId,
      dto.businessSlug,
      user,
    );
    const ticket = await this.support.createTicket(dto, {
      type: SupportTicketType.Business,
      businessId,
      user,
    });
    return ok(
      detail(ticket),
      'Ticket created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'List tickets created by the logged-in user' })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  async myTickets(@Query() query: TicketQueryDto, @CurrentUser() user: JwtUser) {
    const result = await this.support.findMyTickets(user.id, query);
    return {
      ...ok(list(result.data), 'Operation completed successfully'),
      meta: result.meta,
    };
  }

  @Get('my-tickets/:id')
  @ApiOperation({ summary: 'Get one of the logged-in user’s tickets' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async myTicket(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const ticket = await this.support.findMyTicket(id, user.id);
    return ok(detail(ticket), 'Ticket fetched successfully');
  }

  @Post('my-tickets/:id/reply')
  @ApiOperation({ summary: 'Reply to your own ticket (continue the conversation)' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async replyMyTicket(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser() user: JwtUser,
  ) {
    const ticket = await this.support.replyAsCustomer(id, dto, user);
    return ok(detail(ticket), 'Reply sent successfully');
  }

  // ────────────────────────────────────────────────────────────────────
  // CRM — business Contact Center (X-Business-Id scoped)
  // ────────────────────────────────────────────────────────────────────

  @Get('admin/tickets')
  @RequireFeature(FEATURES.VIEW_TICKETS)
  @ApiOperation({ summary: 'CRM: list this business’s Contact-Us tickets' })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  async crmList(
    @Query() query: TicketQueryDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const result = await this.support.findForBusiness(businessId, query);
    return {
      ...ok(list(result.data), 'Operation completed successfully'),
      meta: result.meta,
    };
  }

  @Get('admin/tickets/:id')
  @RequireFeature(FEATURES.VIEW_TICKETS)
  @ApiOperation({ summary: 'CRM: ticket detail with full conversation' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async crmDetail(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
  ) {
    const ticket = await this.support.findOneForBusiness(id, businessId);
    return ok(detail(ticket), 'Ticket fetched successfully');
  }

  @Post('admin/tickets/:id/reply')
  @RequireFeature(FEATURES.MANAGE_TICKETS)
  @ApiOperation({ summary: 'CRM: reply to a ticket (emails the customer)' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async crmReply(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @Headers('x-business-id') businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const ticket = await this.support.replyForBusiness(id, dto, businessId, user);
    return ok(detail(ticket), 'Reply sent successfully');
  }

  @Patch('admin/tickets/:id')
  @RequireFeature(FEATURES.MANAGE_TICKETS)
  @ApiOperation({ summary: 'CRM: update status / assignee' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async crmUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const ticket = await this.support.updateForBusiness(id, dto, businessId);
    return ok(detail(ticket), 'Ticket updated successfully');
  }

  // ────────────────────────────────────────────────────────────────────
  // Platform — landing-page Contact Us (Super Admin only)
  // ────────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('platform/tickets')
  @ApiOperation({ summary: 'Submit a Contact-Us request from the marketing landing page' })
  @ApiResponse({ status: 201, type: TicketDetailResponseDto })
  async createPlatformTicket(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user?: JwtUser,
  ) {
    const ticket = await this.support.createTicket(dto, {
      type: SupportTicketType.Platform,
      businessId: null,
      user,
    });
    return ok(detail(ticket), 'Ticket created successfully', HttpStatus.CREATED);
  }

  @UseGuards(SuperAdminGuard)
  @Get('platform/tickets')
  @ApiOperation({ summary: 'Super Admin: list platform tickets' })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  async platformList(@Query() query: TicketQueryDto) {
    const result = await this.support.findPlatform(query);
    return {
      ...ok(list(result.data), 'Operation completed successfully'),
      meta: result.meta,
    };
  }

  @UseGuards(SuperAdminGuard)
  @Get('platform/tickets/:id')
  @ApiOperation({ summary: 'Super Admin: platform ticket detail' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async platformDetail(@Param('id') id: string) {
    const ticket = await this.support.findOnePlatform(id);
    return ok(detail(ticket), 'Ticket fetched successfully');
  }

  @UseGuards(SuperAdminGuard)
  @Post('platform/tickets/:id/reply')
  @ApiOperation({ summary: 'Super Admin: reply to a platform ticket' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async platformReply(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser() user: JwtUser,
  ) {
    const ticket = await this.support.replyPlatform(id, dto, user);
    return ok(detail(ticket), 'Reply sent successfully');
  }

  @UseGuards(SuperAdminGuard)
  @Patch('platform/tickets/:id')
  @ApiOperation({ summary: 'Super Admin: update platform ticket status / assignee' })
  @ApiResponse({ status: 200, type: TicketDetailResponseDto })
  async platformUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    const ticket = await this.support.updatePlatform(id, dto);
    return ok(detail(ticket), 'Ticket updated successfully');
  }

  // ────────────────────────────────────────────────────────────────────

  private async resolveBusinessId(
    headerBusinessId: string | undefined,
    businessSlug: string | undefined,
    user?: JwtUser,
  ): Promise<string> {
    if (headerBusinessId) return headerBusinessId;
    if (businessSlug) {
      const business = await this.businessService.findOneBySlug(businessSlug);
      return business.id;
    }
    // A logged-in customer's token is scoped to a single business.
    if (user?.businessId) return user.businessId;
    throw new BadRequestException(
      'Provide the business via businessSlug (body) or the X-Business-Id header',
    );
  }
}

const detail = (data: unknown) =>
  plainToInstance(TicketDetailResponseDto, data, {
    excludeExtraneousValues: true,
  });

const list = (data: unknown) =>
  plainToInstance(TicketResponseDto, data, { excludeExtraneousValues: true });

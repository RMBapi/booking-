import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SupportMessageAuthor,
  SupportTicketStatus,
  SupportTicketType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { MailService } from '../../mail/mail.service';
import { JwtUser } from '../auth/decorators/current-user.decorator';
import { SYSTEM_ROLES } from '../../common/constants/permissions';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReplyTicketDto } from './dto/reply-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';

const PLATFORM_NAME = 'Cuebites';

const TICKET_INCLUDE = {
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} satisfies Prisma.SupportTicketInclude;

const TICKET_DETAIL_INCLUDE = {
  ...TICKET_INCLUDE,
  messages: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.SupportTicketInclude;

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly mail: MailService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────
  // Creation (customer / public)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Create a ticket. `businessId` is null for platform (landing-page) tickets.
   * When `user` is present (logged in) the requester identity comes from their
   * profile and `name`/`email`/`phone` in the DTO are ignored.
   */
  async createTicket(
    dto: CreateTicketDto,
    opts: { type: SupportTicketType; businessId: string | null; user?: JwtUser },
  ) {
    const { type, businessId, user } = opts;

    let requesterName: string;
    let requesterEmail: string;
    let requesterPhone: string | null;
    let requesterUserId: string | null = null;

    if (user) {
      requesterName = `${user.firstName} ${user.lastName}`.trim();
      requesterEmail = user.email;
      requesterPhone = user.phone || null;
      requesterUserId = user.id;
    } else {
      // Guest submission: collect the same identity we'd otherwise read from a
      // logged-in user's profile (name + email + phone), so both paths produce
      // a ticket with a consistent, contactable requester.
      if (!dto.name || !dto.email || !dto.phone) {
        throw new BadRequestException(
          'name, email and phone are required when not logged in',
        );
      }
      requesterName = dto.name;
      requesterEmail = dto.email;
      requesterPhone = dto.phone;
    }

    let orgName = PLATFORM_NAME;
    if (type === SupportTicketType.Business) {
      if (!businessId) {
        throw new BadRequestException('businessId is required for business tickets');
      }
      const business = await this.prisma.business.findFirst({
        where: { id: businessId, deletedAt: null },
        select: { name: true },
      });
      if (!business) {
        throw new NotFoundException('Business not found');
      }
      orgName = business.name;
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        type,
        businessId,
        status: SupportTicketStatus.Open,
        subject: dto.subject,
        requesterUserId,
        requesterName,
        requesterEmail,
        requesterPhone,
        lastReplyAt: new Date(),
        messages: {
          create: {
            authorType: SupportMessageAuthor.Customer,
            authorUserId: requesterUserId,
            authorName: requesterName,
            body: dto.message,
          },
        },
      },
      include: TICKET_DETAIL_INCLUDE,
    });

    this.mail.sendTicketReceivedEmail(requesterEmail, {
      orgName,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      message: dto.message,
    });

    return shapeTicket(ticket);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Customer self-service (logged in)
  // ──────────────────────────────────────────────────────────────────────

  async findMyTickets(userId: string, query: TicketQueryDto) {
    const where: Prisma.SupportTicketWhereInput = {
      requesterUserId: userId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    return this.paginate(where, query);
  }

  async findMyTicket(id: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, requesterUserId: userId, deletedAt: null },
      include: TICKET_DETAIL_INCLUDE,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return shapeTicket(ticket);
  }

  async replyAsCustomer(id: string, dto: ReplyTicketDto, user: JwtUser) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, requesterUserId: user.id, deletedAt: null },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === SupportTicketStatus.Closed) {
      throw new BadRequestException(
        'This ticket is closed. Please open a new request.',
      );
    }
    return this.appendMessage(ticket.id, {
      authorType: SupportMessageAuthor.Customer,
      authorUserId: user.id,
      authorName: `${user.firstName} ${user.lastName}`.trim(),
      body: dto.message,
      // Re-open for staff attention.
      nextStatus: SupportTicketStatus.Open,
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // CRM (business staff) — scoped by businessId
  // ──────────────────────────────────────────────────────────────────────

  async findForBusiness(businessId: string, query: TicketQueryDto) {
    const where = this.staffWhere(query, {
      type: SupportTicketType.Business,
      businessId,
    });
    return this.paginate(where, query);
  }

  async findOneForBusiness(id: string, businessId: string) {
    return this.getScopedDetail(id, {
      type: SupportTicketType.Business,
      businessId,
    });
  }

  async replyForBusiness(
    id: string,
    dto: ReplyTicketDto,
    businessId: string,
    user: JwtUser,
  ) {
    const ticket = await this.getScopedTicket(id, {
      type: SupportTicketType.Business,
      businessId,
    });
    return this.staffReply(ticket, dto, user);
  }

  async updateForBusiness(
    id: string,
    dto: UpdateTicketDto,
    businessId: string,
  ) {
    const ticket = await this.getScopedTicket(id, {
      type: SupportTicketType.Business,
      businessId,
    });
    return this.applyUpdate(ticket, dto, businessId);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Platform (super admin) — businessId is null
  // ──────────────────────────────────────────────────────────────────────

  async findPlatform(query: TicketQueryDto) {
    const where = this.staffWhere(query, {
      type: SupportTicketType.Platform,
      businessId: null,
    });
    return this.paginate(where, query);
  }

  async findOnePlatform(id: string) {
    return this.getScopedDetail(id, {
      type: SupportTicketType.Platform,
      businessId: null,
    });
  }

  async replyPlatform(id: string, dto: ReplyTicketDto, user: JwtUser) {
    const ticket = await this.getScopedTicket(id, {
      type: SupportTicketType.Platform,
      businessId: null,
    });
    return this.staffReply(ticket, dto, user);
  }

  async updatePlatform(id: string, dto: UpdateTicketDto) {
    const ticket = await this.getScopedTicket(id, {
      type: SupportTicketType.Platform,
      businessId: null,
    });
    return this.applyUpdate(ticket, dto, null);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Shared internals
  // ──────────────────────────────────────────────────────────────────────

  private staffWhere(
    query: TicketQueryDto,
    scope: { type: SupportTicketType; businessId: string | null },
  ): Prisma.SupportTicketWhereInput {
    const where: Prisma.SupportTicketWhereInput = {
      type: scope.type,
      businessId: scope.businessId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.unassigned === 'true') {
      where.assignedToUserId = null;
    } else if (query.assignedToUserId) {
      where.assignedToUserId = query.assignedToUserId;
    }
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { requesterName: { contains: query.search, mode: 'insensitive' } },
        { requesterEmail: { contains: query.search, mode: 'insensitive' } },
        { messages: { some: { body: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    return where;
  }

  private async paginate(
    where: Prisma.SupportTicketWhereInput,
    query: TicketQueryDto,
  ) {
    const paginationOptions =
      this.paginationService.buildPaginationOptions(query);
    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        ...paginationOptions,
        include: TICKET_INCLUDE,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const meta = this.paginationService.buildMeta(page, limit, total);
    return { data: data.map(shapeTicket), meta };
  }

  private async getScopedTicket(
    id: string,
    scope: { type: SupportTicketType; businessId: string | null },
  ) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id,
        type: scope.type,
        businessId: scope.businessId,
        deletedAt: null,
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private async getScopedDetail(
    id: string,
    scope: { type: SupportTicketType; businessId: string | null },
  ) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id,
        type: scope.type,
        businessId: scope.businessId,
        deletedAt: null,
      },
      include: TICKET_DETAIL_INCLUDE,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return shapeTicket(ticket);
  }

  /** Staff/admin reply: append message, set WaitingForCustomer, email customer. */
  private async staffReply(
    ticket: { id: string },
    dto: ReplyTicketDto,
    user: JwtUser,
  ) {
    const replierName = `${user.firstName} ${user.lastName}`.trim();
    const detail = await this.appendMessage(ticket.id, {
      authorType: SupportMessageAuthor.Staff,
      authorUserId: user.id,
      authorName: replierName,
      body: dto.message,
      viaEmail: true,
      nextStatus: SupportTicketStatus.WaitingForCustomer,
    });

    const orgName = await this.resolveOrgName(detail.businessId);
    this.mail.sendTicketReplyEmail(detail.requesterEmail, {
      orgName,
      ticketNumber: detail.ticketNumber,
      subject: detail.subject,
      replierName,
      message: dto.message,
    });

    return detail;
  }

  /** Insert a message and advance ticket status/timestamps in one transaction. */
  private async appendMessage(
    ticketId: string,
    msg: {
      authorType: SupportMessageAuthor;
      authorUserId: string | null;
      authorName: string;
      body: string;
      viaEmail?: boolean;
      nextStatus: SupportTicketStatus;
    },
  ) {
    const now = new Date();
    const [, updated] = await this.prisma.$transaction([
      this.prisma.supportMessage.create({
        data: {
          ticketId,
          authorType: msg.authorType,
          authorUserId: msg.authorUserId,
          authorName: msg.authorName,
          body: msg.body,
          viaEmail: msg.viaEmail ?? false,
        },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: msg.nextStatus,
          lastReplyAt: now,
          ...(msg.nextStatus === SupportTicketStatus.Resolved
            ? { resolvedAt: now }
            : {}),
        },
        include: TICKET_DETAIL_INCLUDE,
      }),
    ]);
    return shapeTicket(updated);
  }

  private async applyUpdate(
    ticket: { id: string; businessId: string | null; type: SupportTicketType },
    dto: UpdateTicketDto,
    businessId: string | null,
  ) {
    const data: Prisma.SupportTicketUpdateInput = {};

    if (dto.status) {
      data.status = dto.status;
      if (dto.status === SupportTicketStatus.Resolved) data.resolvedAt = new Date();
      if (dto.status === SupportTicketStatus.Closed) data.closedAt = new Date();
    }

    if (dto.assignedToUserId !== undefined) {
      if (dto.assignedToUserId === null) {
        data.assignedTo = { disconnect: true };
      } else {
        await this.assertAssignable(dto.assignedToUserId, ticket.type, businessId);
        data.assignedTo = { connect: { id: dto.assignedToUserId } };
      }
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data,
      include: TICKET_DETAIL_INCLUDE,
    });
    return shapeTicket(updated);
  }

  /** Assignee must be an active member of the business (or a super admin for platform tickets). */
  private async assertAssignable(
    userId: string,
    type: SupportTicketType,
    businessId: string | null,
  ) {
    if (type === SupportTicketType.Platform) {
      const admin = await this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
          systemRole: SYSTEM_ROLES.SUPER_ADMIN,
        },
        select: { id: true },
      });
      if (!admin) {
        throw new ForbiddenException(
          'Platform tickets can only be assigned to a super admin',
        );
      }
      return;
    }

    const membership = await this.prisma.userBusiness.findUnique({
      where: { userId_businessId: { userId, businessId: businessId as string } },
      select: { status: true },
    });
    if (!membership || membership.status !== 'Active') {
      throw new BadRequestException(
        'Assignee must be an active member of this business',
      );
    }
  }

  private async resolveOrgName(businessId: string | null): Promise<string> {
    if (!businessId) return PLATFORM_NAME;
    const business = await this.prisma.business.findFirst({
      where: { id: businessId },
      select: { name: true },
    });
    return business?.name ?? PLATFORM_NAME;
  }
}

type RawTicket = Prisma.SupportTicketGetPayload<{
  include: typeof TICKET_INCLUDE;
}> & {
  messages?: Prisma.SupportMessageGetPayload<true>[];
};

/** Flatten Prisma relations into the shape the response DTOs expose. */
function shapeTicket(ticket: RawTicket) {
  const assignedTo = ticket.assignedTo
    ? {
        id: ticket.assignedTo.id,
        name: `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`.trim(),
        email: ticket.assignedTo.email,
      }
    : null;

  return {
    ...ticket,
    assignedTo,
    messages: ticket.messages ?? undefined,
  };
}

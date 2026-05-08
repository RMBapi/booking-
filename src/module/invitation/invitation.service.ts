import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../mail/mail.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { SYSTEM_ROLES } from '../../common/constants/permissions';

const INVITATION_TTL_DAYS = 7;
const TOKEN_BYTES = 32;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(
    businessId: string,
    dto: CreateInvitationDto,
    inviterUserId: string,
  ) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!business) throw new NotFoundException('Business not found');

    const existingMember = await this.prisma.userBusiness.findFirst({
      where: {
        businessId,
        user: { email: dto.email, deletedAt: null },
      },
      select: { id: true },
    });
    if (existingMember) {
      throw new ConflictException('User is already a member of this business');
    }

    const pending = await this.prisma.businessInvitation.findFirst({
      where: {
        businessId,
        email: dto.email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (pending) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterUserId },
      select: { firstName: true, lastName: true },
    });

    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const created = await this.prisma.businessInvitation.create({
      data: {
        businessId,
        email: dto.email,
        role: dto.role ?? SYSTEM_ROLES.SERVICE_PROVIDER,
        invitedBy: inviterUserId,
        tokenHash,
        expiresAt,
      },
    });

    const acceptUrl = this.buildAcceptUrl(rawToken);
    const inviterName = inviter
      ? `${inviter.firstName} ${inviter.lastName}`.trim()
      : 'A teammate';

    this.mail.sendInvitationEmail(dto.email, {
      businessName: business.name,
      inviterName,
      acceptUrl,
      expiresAt,
    });

    this.logger.log(
      `Invitation ${created.id} created for ${dto.email} → business ${businessId}`,
    );
    return { ...created, token: rawToken };
  }

  async listPending(businessId: string) {
    return this.prisma.businessInvitation.findMany({
      where: { businessId, acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(businessId: string, invitationId: string, byUserId: string) {
    const inv = await this.prisma.businessInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!inv || inv.businessId !== businessId) {
      throw new NotFoundException('Invitation not found');
    }
    if (inv.acceptedAt) {
      throw new BadRequestException('Cannot revoke an accepted invitation');
    }
    if (inv.revokedAt) return inv;

    return this.prisma.businessInvitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date(), revokedBy: byUserId },
    });
  }

  async viewByToken(rawToken: string) {
    const inv = await this.findByToken(rawToken);
    if (!inv) throw new NotFoundException('Invitation not found');

    const business = await this.prisma.business.findUnique({
      where: { id: inv.businessId },
      select: { name: true },
    });

    return {
      businessName: business?.name ?? 'Unknown business',
      email: inv.email,
      role: inv.role,
      isExpired: inv.expiresAt.getTime() < Date.now(),
      isRevoked: !!inv.revokedAt,
      isAccepted: !!inv.acceptedAt,
    };
  }

  async acceptForUser(rawToken: string, userId: string) {
    const inv = await this.findByToken(rawToken);
    if (!inv) throw new NotFoundException('Invitation not found');

    this.assertAcceptable(inv);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    return this.applyAcceptance(inv.id, inv.businessId, userId, inv.role);
  }

  async acceptDuringRegister(
    rawToken: string,
    userId: string,
    userEmail: string,
  ) {
    const inv = await this.findByToken(rawToken);
    if (!inv) throw new NotFoundException('Invitation not found');
    this.assertAcceptable(inv);

    if (userEmail.toLowerCase() !== inv.email.toLowerCase()) {
      throw new ForbiddenException(
        'Registration email does not match the invitation',
      );
    }

    return this.applyAcceptance(inv.id, inv.businessId, userId, inv.role);
  }

  /**
   * Look up an invitation by its raw token without consuming it.
   * Used by the activation flow to validate tokens before showing the
   * password form.
   */
  async findByTokenPublic(rawToken: string) {
    return this.findByToken(rawToken);
  }

  /**
   * Mark an invitation accepted in a transaction-friendly way (used by
   * the activation flow which also creates/activates the user).
   */
  async markAccepted(
    tx: Pick<PrismaService, 'businessInvitation'>,
    invitationId: string,
    userId: string,
  ) {
    return tx.businessInvitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date(), acceptedBy: userId },
    });
  }

  private buildAcceptUrl(rawToken: string): string {
    const base = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    return `${base}/accept-invitation?token=${encodeURIComponent(rawToken)}`;
  }

  private async findByToken(rawToken: string) {
    if (!rawToken) return null;
    const tokenHash = hashToken(rawToken);
    return this.prisma.businessInvitation.findUnique({ where: { tokenHash } });
  }

  private assertAcceptable(inv: {
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  }) {
    if (inv.acceptedAt)
      throw new BadRequestException('Invitation already accepted');
    if (inv.revokedAt)
      throw new BadRequestException('Invitation has been revoked');
    if (inv.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invitation has expired');
    }
  }

  private async applyAcceptance(
    invitationId: string,
    businessId: string,
    userId: string,
    role: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userBusiness.upsert({
        where: { userId_businessId: { userId, businessId } },
        create: {
          userId,
          businessId,
          role:
            role === SYSTEM_ROLES.BUSINESS_OWNER
              ? SYSTEM_ROLES.BUSINESS_OWNER
              : SYSTEM_ROLES.SERVICE_PROVIDER,
        },
        update: {},
      });

      return tx.businessInvitation.update({
        where: { id: invitationId },
        data: { acceptedAt: new Date(), acceptedBy: userId },
      });
    });
  }
}

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(
      `Registration attempt for email: ${registerDto.email}, role: ${registerDto.role}`,
    );

    try {
      if (registerDto.role === 'Super_Admin') {
        this.logger.warn(
          `Registration blocked: Attempted Super_Admin self-registration for ${registerDto.email}`,
        );
        throw new ConflictException(
          'Super_Admin accounts cannot be created through registration',
        );
      }

      // Resolve the Role entity first (validates the role exists in DB)
      const roleEntity = await this.prisma.role.findUnique({
        where: { name: registerDto.role },
      });
      if (!roleEntity) {
        throw new ConflictException(`Role '${registerDto.role}' does not exist`);
      }

      // Check if this email+role combination already exists (via UserRole join)
      this.logger.debug(
        `Checking existing user: email=${registerDto.email}, role=${registerDto.role}`,
      );
      const existingUserWithRole = await this.prisma.user.findFirst({
        where: {
          email: registerDto.email,
          deletedAt: null,
          userRoles: { some: { roleId: roleEntity.id } },
        },
      });

      if (existingUserWithRole) {
        this.logger.warn(
          `Registration failed: ${registerDto.email} already registered with role ${registerDto.role}`,
        );
        throw new ConflictException(
          `Email already registered with the role ${registerDto.role}`,
        );
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

      // Customers are immediately active; others require activation
      const isActive = registerDto.role === 'Customer';

      const user = await this.prisma.$transaction(async (tx) => {
        const baseUser = await tx.user.create({
          data: {
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            email: registerDto.email,
            phone: registerDto.phone,
            passwordHash,
            isActive,
            // Note: User.roles (legacy enum array) intentionally not written here.
            // All role state is stored in the user_roles join table.
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        // Create the UserRole join row (dynamic RBAC)
        await tx.userRole.create({
          data: { userId: baseUser.id, roleId: roleEntity.id },
        });

        // For Customers, scope their account to the given business site
        if (registerDto.role === 'Customer') {
          if (!registerDto.businessSiteSlug) {
            this.logger.warn(
              `Registration failed: businessSiteSlug required for Customer (${registerDto.email})`,
            );
            throw new ConflictException(
              'businessSiteSlug is required when registering a Customer',
            );
          }

          const business = await tx.business.findFirst({
            where: { slug: registerDto.businessSiteSlug, deletedAt: null },
            select: { id: true, name: true, slug: true },
          });

          if (!business) {
            this.logger.warn(
              `Registration failed: Business not found for slug ${registerDto.businessSiteSlug}`,
            );
            throw new ConflictException('Business not found for provided slug');
          }

          let businessSite = await tx.businessSite.findFirst({
            where: { businessId: business.id, slug: registerDto.businessSiteSlug, deletedAt: null },
            select: { id: true },
          });

          if (!businessSite) {
            businessSite = await tx.businessSite.create({
              data: {
                businessId: business.id,
                name: `${business.name} Site`,
                slug: business.slug,
              },
              select: { id: true },
            });
            this.logger.debug(`Created BusinessSite: ${businessSite.id}`);
          }

          await tx.customerBusinessSite.create({
            data: { userId: baseUser.id, businessSiteId: businessSite.id },
          });
        }

        return baseUser;
      });

      this.logger.log(`User created successfully with ID: ${user.id}`);

      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        activeRole: registerDto.role,
      });

      return {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: [registerDto.role],
          activeRole: registerDto.role,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack  = error instanceof Error ? error.stack  : undefined;
      this.logger.error(
        `Registration failed for ${registerDto.email}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(
      `Login attempt for email: ${loginDto.email}, role: ${loginDto.role ?? 'auto-select'}`,
    );

    try {
      // Find user by email and resolve assigned roles via UserRole join table
      const user = await this.prisma.user.findFirst({
        where: {
          email: loginDto.email,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          isActive: true,
          deletedAt: true,
          userRoles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        this.logger.warn(
          `Login failed: No user with email=${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const roleNames = user.userRoles.map((ur) => ur.role.name);

      let selectedRole: string;
      if (loginDto.role) {
        if (!roleNames.includes(loginDto.role)) {
          this.logger.warn(
            `Login failed: User ${loginDto.email} attempted unauthorized role ${loginDto.role}`,
          );
          throw new UnauthorizedException('Invalid credentials');
        }
        selectedRole = loginDto.role;
      } else {
        const nonCustomerRoles = roleNames
          .filter((roleName) => roleName !== 'Customer')
          .sort();

        if (!nonCustomerRoles.length) {
          this.logger.warn(
            `Login failed: Customer login requires explicit role and businessSiteSlug (${loginDto.email})`,
          );
          throw new UnauthorizedException('Invalid credentials');
        }

        selectedRole = nonCustomerRoles[0];
      }

      // Customers must belong to the requested business site
      if (selectedRole === 'Customer') {
        if (!loginDto.businessSiteSlug) {
          throw new UnauthorizedException('Invalid credentials');
        }

        const customerSite = await this.prisma.customerBusinessSite.findFirst({
          where: {
            userId: user.id,
            businessSite: { slug: loginDto.businessSiteSlug, deletedAt: null },
          },
          select: { id: true },
        });

        if (!customerSite) {
          this.logger.warn(
            `Login failed: Customer not associated with slug ${loginDto.businessSiteSlug} (${loginDto.email})`,
          );
          throw new UnauthorizedException('Invalid credentials');
        }
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      if (user.deletedAt) {
        throw new UnauthorizedException('Account not found');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for user: ${user.id}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        activeRole: selectedRole,
      });

      this.logger.log(
        `Login successful for user: ${user.email} (ID: ${user.id}) with role: ${selectedRole}`,
      );
      return {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: roleNames,
          activeRole: selectedRole,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn(
          `Login failed for ${loginDto.email}: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack  = error instanceof Error ? error.stack  : undefined;
        this.logger.error(`Login error for ${loginDto.email}: ${errorMessage}`, errorStack);
      }
      throw error;
    }
  }

  async validateUser(userId: string) {
    this.logger.debug(`Validating user with ID: ${userId}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          userRoles: { select: { role: { select: { name: true } } } },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        ...user,
        roles: user.userRoles.map((ur) => ur.role.name),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack  = error instanceof Error ? error.stack  : undefined;
      this.logger.error(`User validation error for ${userId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}

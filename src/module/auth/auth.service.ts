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
      // Prevent Super_Admin self-registration for security
      if (registerDto.role === 'Super_Admin') {
        this.logger.warn(
          `Registration blocked: Attempted Super_Admin self-registration for ${registerDto.email}`,
        );
        throw new ConflictException(
          'Super_Admin accounts cannot be created through registration',
        );
      }

      // Check if a user already exists with this email AND role
      this.logger.debug(
        `Checking for existing user with email: ${registerDto.email} and role: ${registerDto.role}`,
      );
      const existingUserWithRole = await this.prisma.user.findFirst({
        where: {
          email: registerDto.email,
          roles: {
            has: registerDto.role,
          },
          deletedAt: null,
        },
      });

      if (existingUserWithRole) {
        this.logger.warn(
          `Registration failed: Email ${registerDto.email} already registered with role ${registerDto.role}`,
        );
        throw new ConflictException(
          `Email already registered with the role ${registerDto.role}`,
        );
      }

      // Hash password
      this.logger.debug('Hashing password');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

      // Create a NEW user row for this registration.
      // Even if the same email exists with other roles, we treat each
      // (email, role) combination as a separate account so credentials
      // and profile data can differ.
      this.logger.debug('Creating user in database');
      const user = await this.prisma.user.create({
        data: {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          email: registerDto.email,
          phone: registerDto.phone,
          passwordHash,
          roles: [registerDto.role],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          roles: true,
        },
      });

      this.logger.log(`User created successfully with ID: ${user.id}`);

      // Generate JWT token
      this.logger.debug('Generating JWT token');
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        activeRole: registerDto.role,
      });

      this.logger.log(`Registration successful for user: ${user.email}`);
      return {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          activeRole: registerDto.role,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Registration failed for ${registerDto.email}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(
      `Login attempt for email: ${loginDto.email}, role: ${loginDto.role}`,
    );

    try {
      // Find user by email AND role so that each (email, role) account
      // can have its own password and profile data.
      this.logger.debug(
        `Looking up user with email: ${loginDto.email} and role: ${loginDto.role}`,
      );
      const user = await this.prisma.user.findFirst({
        where: {
          email: loginDto.email,
          roles: {
            has: loginDto.role,
          },
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          roles: true,
          firstName: true,
          lastName: true,
          isActive: true,
          deletedAt: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `Login failed: User not found with email: ${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        this.logger.warn(`Login failed: Account inactive for user: ${user.id}`);
        throw new UnauthorizedException('Account is inactive');
      }

      // Check if user is deleted
      if (user.deletedAt) {
        this.logger.warn(`Login failed: Account deleted for user: ${user.id}`);
        throw new UnauthorizedException('Account not found');
      }

      // Verify password
      this.logger.debug('Verifying password');
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for user: ${user.id}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token with activeRole
      this.logger.debug('Generating JWT token');
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        activeRole: loginDto.role,
      });

      this.logger.log(
        `Login successful for user: ${user.email} (ID: ${user.id}) with role: ${loginDto.role}`,
      );
      return {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          activeRole: loginDto.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // Don't log stack trace for expected auth failures
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Login failed for ${loginDto.email}: ${errorMessage}`);
      } else {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Login error for ${loginDto.email}: ${errorMessage}`,
          errorStack,
        );
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
          roles: true,
          isActive: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `User validation failed: User not found with ID: ${userId}`,
        );
        throw new UnauthorizedException('User not found or inactive');
      }

      if (!user.isActive) {
        this.logger.warn(
          `User validation failed: User inactive with ID: ${userId}`,
        );
        throw new UnauthorizedException('User not found or inactive');
      }

      this.logger.debug(`User validated successfully: ${user.email}`);
      return user;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `User validation error for ${userId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}

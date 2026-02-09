import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: `Register a new user account. This endpoint is public and does not require authentication.

**Use Cases:**
- User registration forms
- Sign-up flows
- Account creation

**Available Roles:**
- \`Customer\` - End users who can book services
- \`Service_Provider\` - Staff members who provide services
- \`Business_owner\` - Business owners who manage their business
- \`Super_Admin\` - System administrators (use with caution)

**Request Body:**
- \`firstName\` (required) - User's first name
- \`lastName\` (required) - User's last name
- \`email\` (required) - User's email (must be unique)
- \`phone\` (required) - User's phone number
- \`password\` (required) - User's password (will be hashed)
- \`role\` (required) - User role (Customer, Service_Provider, Business_owner, or Super_Admin)

**Response:**
Returns JWT access token and user information. Token expires in 7 days.`,
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered - User with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data or missing required fields',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registration request for: ${registerDto.email}`);
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log(`Registration successful for: ${registerDto.email}`);
      return result;
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

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description: `Login with email and password to get a JWT access token. This endpoint is public and does not require authentication.

**Use Cases:**
- User login forms
- Authentication flows
- Token generation for protected endpoints

**Request Body:**
- \`email\` (required) - User's email
- \`password\` (required) - User's password
- \`role\` (required) - User role (must match one of user's roles)

**Response:**
Returns JWT access token and user information. Token expires in 7 days.

**Important Notes:**
- User must be active (isActive === true)
- User must not be soft-deleted
- Password is verified against hashed password in database
- Role must match one of the user's assigned roles`,
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid email, password, or role',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing required fields',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login request for: ${loginDto.email}`);
    try {
      const result = await this.authService.login(loginDto);
      this.logger.log(`Login successful for: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`Login failed for ${loginDto.email}: ${error.message}`);
      throw error;
    }
  }
}

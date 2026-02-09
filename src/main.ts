import 'dotenv/config';
import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('Starting application...');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS if needed
    app.enableCors();

    // Apply logging middleware globally
    app.use(new LoggingMiddleware().use.bind(new LoggingMiddleware()));

    // Apply global exception filter for better error logging
    app.useGlobalFilters(new HttpExceptionFilter());

    // Enable validation pipes globally
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger Configuration
    const config = new DocumentBuilder()
      .setTitle('Booking Management System API')
      .setDescription('API documentation for the Booking Management System')
      .setVersion('1.0')
      .setContact('Support', '', 'support@example.com')
      .addTag('Authentication', 'User registration and login endpoints')
      .addTag('User', 'User profile and personal data endpoints')
      .addTag('Business', 'Business management endpoints')
      .addTag('Service', 'Service management endpoints')
      .addTag('Service Provider', 'Service provider management endpoints')
      .addTag('Scheduler', 'Scheduler and time slot management endpoints')
      .addTag(
        'Contact',
        'Contact management endpoints (for non-logged-in users)',
      )
      .addTag('Booking', 'Booking management endpoints')
      .addTag('Admin', 'Super Admin only endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description:
            'Enter JWT token. You can get this by registering or logging in via /auth/register or /auth/login endpoints. Format: Bearer {token} or just paste the token directly.',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer('http://localhost:3000', 'Development server')
      .addServer('https://api.example.com', 'Production server')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Swagger documentation available at: http://localhost:${port}/api`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}
void bootstrap();

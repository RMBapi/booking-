import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      const error = new Error('DATABASE_URL environment variable is not set');
      // Can't use this.logger here, must call super() first
      console.error('Database configuration error:', error.message);
      throw error;
    }

    // For Prisma 7, we need to use an adapter
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    // Must call super() before accessing this
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Now we can use this.logger after super() is called
    this.logger.log('Initializing Prisma client with PostgreSQL adapter');

    // Log database queries in development
    if (process.env.NODE_ENV !== 'production') {
      this.$on('query' as never, (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
      });
    }

    this.$on('error' as never, (e: { message: string }) => {
      this.logger.error(`Database error: ${e.message}`, e);
    });

    this.$on('info' as never, (e: { message: string }) => {
      this.logger.log(`Database info: ${e.message}`);
    });

    this.$on('warn' as never, (e: { message: string }) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to connect to database: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('Successfully disconnected from database');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error disconnecting from database: ${errorMessage}`,
        errorStack,
      );
    }
  }
}

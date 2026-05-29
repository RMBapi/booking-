import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './module/auth/auth.module';
import { AdminModule } from './module/admin/admin.module';
import { UserModule } from './module/user/user.module';
import { BusinessModule } from './module/business/business.module';
import { BusinessTeamModule } from './module/business-team/business-team.module';
import { ServiceModule } from './module/service/service.module';
import { ServiceProviderModule } from './module/service_provider/service_provider.module';
import { ContactModule } from './module/contact/contact.module';
import { BookingModule } from './module/booking/booking.module';
import { ReviewModule } from './module/review/review.module';
import { SchedulerModule } from './module/scheduler/scheduler.module';
import { UploadModule } from './module/upload/upload.module';
import { InvitationModule } from './module/invitation/invitation.module';
import { AnalyticsModule } from './module/analytics/analytics.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    // Global rate limiting. The default bucket caps any single IP at
    // 100 req/min; auth-sensitive routes layer stricter @Throttle()
    // overrides on top. Single-instance only — for multi-instance
    // deploys swap the default in-memory storage for a Redis backend.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    AdminModule,
    UserModule,
    BusinessModule,
    BusinessTeamModule,
    ServiceModule,
    ServiceProviderModule,
    ContactModule,
    BookingModule,
    ReviewModule,
    SchedulerModule,
    UploadModule,
    InvitationModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}

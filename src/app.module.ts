import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './module/auth/auth.module';
import { AdminModule } from './module/admin/admin.module';
import { UserModule } from './module/user/user.module';
import { BusinessModule } from './module/business/business.module';
import { ServiceModule } from './module/service/service.module';
import { ServiceProviderModule } from './module/service_provider/service_provider.module';
import { ContactModule } from './module/contact/contact.module';
import { BookingModule } from './module/booking/booking.module';
import { SchedulerModule } from './module/scheduler/scheduler.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AdminModule,
    UserModule,
    BusinessModule,
    ServiceModule,
    ServiceProviderModule,
    ContactModule,
    BookingModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}

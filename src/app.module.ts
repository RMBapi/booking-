import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
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
import { UploadModule } from './module/upload/upload.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import * as path from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.resolve(process.env.UPLOAD_DIR || './uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
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
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}

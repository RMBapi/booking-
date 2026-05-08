import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DatabaseModule } from '../../database/database.module';
import { InvitationModule } from '../invitation/invitation.module';
import { FeatureGuard } from '../../common/guards/feature.guard';
import { getJwtSecret } from '../../config/jwt-secret';

@Module({
  imports: [
    DatabaseModule,
    InvitationModule,
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: (process.env.ACCESS_TOKEN_TTL ??
          '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: FeatureGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}

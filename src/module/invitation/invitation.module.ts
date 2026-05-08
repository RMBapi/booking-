import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { ActivationController } from './activation.controller';
import { MailModule } from '../../mail/mail.module';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret } from '../../config/jwt-secret';

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: (process.env.ACCESS_TOKEN_TTL ??
          '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
  ],
  controllers: [InvitationController, ActivationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}

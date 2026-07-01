import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConnectorService } from './connector.service';
import { ConnectorSecretService } from './secret.service';
import { OutboundRequestService } from './outbound-request.service';
import { ConnectorController } from './connector.controller';

@Module({
  imports: [PrismaModule],
  providers: [ConnectorService, ConnectorSecretService, OutboundRequestService],
  controllers: [ConnectorController],
  exports: [ConnectorService, OutboundRequestService],
})
export class ConnectorsModule {}

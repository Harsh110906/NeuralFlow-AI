import { Global, Module } from '@nestjs/common';
import { ConfigurationValidator } from './configuration-validator';

@Global()
@Module({
  providers: [ConfigurationValidator],
  exports: [ConfigurationValidator],
})
export class AppConfigModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangGraphModule } from './modules/langgraph/langgraph.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LangGraphModule,
  ],
})
export class AppModule {}


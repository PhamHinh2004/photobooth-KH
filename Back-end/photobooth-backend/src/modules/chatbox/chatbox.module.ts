import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Frame } from '../frames/entities/frame.entity';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatboxController } from './chatbox.controller';
import { ChatboxService } from './chatbox.service';
import { AiProviderService } from './services/ai-provider.service';
import { PhotoboothKnowledgeService } from './services/photobooth-knowledge.service';

@Module({
  imports: [TypeOrmModule.forFeature([Frame, ChatSession, ChatMessage])],
  controllers: [ChatboxController],
  providers: [ChatboxService, AiProviderService, PhotoboothKnowledgeService],
  exports: [ChatboxService],
})
export class ChatboxModule {}

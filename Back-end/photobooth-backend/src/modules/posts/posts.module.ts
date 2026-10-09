import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AdminPostsController } from './admin-posts.controller';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { SessionResult } from '../session-results/entities/session-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike, SessionResult])],
  controllers: [PostsController, AdminPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}

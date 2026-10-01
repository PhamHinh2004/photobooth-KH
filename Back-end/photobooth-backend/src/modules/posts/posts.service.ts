import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { SessionResult } from '../session-results/entities/session-result.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike) private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(SessionResult) private readonly sessionRepository: Repository<SessionResult>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: CreatePostDto & { account_id: string }) {
    const session = await this.sessionRepository.findOne({
      where: { id: data.session_id },
      relations: { photo: true },
    });

    if (!session) throw new NotFoundException('Không tìm thấy lượt chụp');
    if (session.account_id !== data.account_id) {
      throw new ForbiddenException('Bạn không phải chủ lượt chụp này');
    }

    const frameId = session.photo?.frame_id;
    if (data.rating && !frameId) {
      throw new BadRequestException('Lượt chụp này không dùng frame nên không thể đánh giá');
    }

    return this.dataSource.transaction(async (manager) => {
      const post = manager.create(Post, {
        ...data,
      });
      const saved = await manager.save(post);

      if (frameId && data.rating) {
        await this.applyRatingToFrame(manager, frameId, data.rating);
      }

      const postWithRelations = await manager.findOne(Post, {
        where: { id: saved.id },
        relations: { account: true },
      });

      this.eventEmitter.emit('post.created', postWithRelations);
      return postWithRelations;
    });
  }

  private async applyRatingToFrame(manager: EntityManager, frameId: string, newRating: number) {
    await manager.query(
      `UPDATE frame
          SET rating = ((rating * rating_count) + $2) / (rating_count + 1),
              rating_count = rating_count + 1
        WHERE id = $1`,
      [frameId, newRating],
    );
  }

  private async revertRatingFromFrame(manager: EntityManager, frameId: string, oldRating: number) {
    await manager.query(
      `UPDATE frame
          SET rating = CASE
                          WHEN rating_count <= 1 THEN 0
                          ELSE ((rating * rating_count) - $2) / (rating_count - 1)
                        END,
              rating_count = GREATEST(rating_count - 1, 0)
        WHERE id = $1`,
      [frameId, oldRating],
    );
  }

  async toggleLike(postId: string, accountId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.postLikeRepository.findOne({
      where: { post_id: postId, account_id: accountId },
    });

    if (existing) {
      await this.postLikeRepository.delete(existing.id);
      await this.postRepository.decrement({ id: postId }, 'likes_count', 1);
    } else {
      await this.postLikeRepository.save({ post_id: postId, account_id: accountId });
      await this.postRepository.increment({ id: postId }, 'likes_count', 1);
    }

    const updatedPost = await this.postRepository.findOne({ where: { id: postId } });
    this.eventEmitter.emit('post.liked', { postId, likesCount: updatedPost!.likes_count });
    return updatedPost;
  }

  async findFeed(page = 1, limit = 10) {
    const [data, total] = await this.postRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: { account: true },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findUserPosts(accountId: string, page = 1, limit = 10) {
    const [data, total] = await this.postRepository.findAndCount({
      where: { account_id: accountId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: { account: true },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { account: true, session: { photo: { frame: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');

    // Increment view count
    await this.postRepository.increment({ id }, 'views_count', 1);

    return post;
  }

  async update(id: string, accountId: string, updatePostDto: UpdatePostDto) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.account_id !== accountId) throw new ForbiddenException('You can only update your own posts');

    Object.assign(post, updatePostDto);
    const updatedPost = await this.postRepository.save(post);

    const postWithRelations = await this.postRepository.findOne({
      where: { id: updatedPost.id },
      relations: { account: true },
    });

    this.eventEmitter.emit('post.updated', postWithRelations);
    return postWithRelations;
  }

  async remove(id: string, accountId: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { session: { photo: true } },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.account_id !== accountId) throw new ForbiddenException('You can only delete your own posts');

    await this.dataSource.transaction(async (manager) => {
      if (post.rating && post.session?.photo?.frame_id) {
        await this.revertRatingFromFrame(manager, post.session.photo.frame_id, post.rating);
      }
      await manager.remove(post);
    });

    this.eventEmitter.emit('post.deleted', id);
  }
}

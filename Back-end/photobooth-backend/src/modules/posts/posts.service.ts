import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike) private readonly postLikeRepository: Repository<PostLike>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(data: CreatePostDto & { account_id: string }) {
    const post = this.postRepository.create(data);
    const saved = await this.postRepository.save(post);

    const postWithRelations = await this.postRepository.findOne({
      where: { id: saved.id },
      relations: { account: true },
    });

    this.eventEmitter.emit('post.created', postWithRelations);
    return postWithRelations;
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
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.account_id !== accountId) throw new ForbiddenException('You can only delete your own posts');

    await this.postRepository.remove(post);
    this.eventEmitter.emit('post.deleted', id);
  }
}

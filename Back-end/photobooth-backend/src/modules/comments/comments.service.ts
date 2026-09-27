import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateCommentDto & { account_id: string }) {
    const comment = this.commentRepository.create(data);
    const saved = await this.commentRepository.save(comment);
    await this.postRepository.increment({ id: data.post_id }, 'comments_count', 1);

    const commentWithRelations = await this.commentRepository.findOne({
      where: { id: saved.id },
      relations: { account: true },
    });

    this.eventEmitter.emit('comment.created', commentWithRelations);
    return commentWithRelations;
  }

  async findByPost(postId: string) {
    return this.commentRepository.find({
      where: { post_id: postId },
      order: { created_at: 'ASC' },
      relations: { account: true },
    });
  }

  async update(id: string, accountId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.account_id !== accountId) throw new ForbiddenException('You can only update your own comments');

    Object.assign(comment, updateCommentDto);
    const updatedComment = await this.commentRepository.save(comment);

    const commentWithRelations = await this.commentRepository.findOne({
      where: { id: updatedComment.id },
      relations: { account: true },
    });

    this.eventEmitter.emit('comment.updated', commentWithRelations);
    return commentWithRelations;
  }

  async remove(id: string, accountId: string) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.account_id !== accountId) throw new ForbiddenException('You can only delete your own comments');

    const postId = comment.post_id;
    await this.commentRepository.remove(comment);
    await this.postRepository.decrement({ id: postId }, 'comments_count', 1);

    this.eventEmitter.emit('comment.deleted', { id, postId });
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: 'Create a new comment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('comments')
  create(
    @CurrentUser() user: { id: string },
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create({ ...createCommentDto, account_id: user.id });
  }

  @ApiOperation({ summary: 'Get comments by post id' })
  @Get('posts/:id/comments')
  findByPost(@Param('id') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @ApiOperation({ summary: 'Update a comment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, user.id, updateCommentDto);
  }

  @ApiOperation({ summary: 'Delete a comment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.commentsService.remove(id, user.id);
  }
}

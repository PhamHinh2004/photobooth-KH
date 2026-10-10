import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Delete,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RepostDto } from './dto/repost.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SessionType } from '../session-results/entities/session-result.entity';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Create a new post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create({ ...createPostDto, account_id: user.id });
  }

  @ApiOperation({ summary: 'Get feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sessionType', required: false, enum: SessionType })
  @Get()
  findFeed(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sessionType') sessionType?: SessionType,
  ) {
    return this.postsService.findFeed(+page, +limit, sessionType);
  }

  // lấy bài viết của chính mình 
  @ApiOperation({ summary: 'Get current user posts' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('me')
  findMyPosts(
    @CurrentUser() user: { id: string },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postsService.findUserPosts(user.id, +page, +limit);
  }

  @ApiOperation({ summary: 'Get posts by user ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('user/:userId')
  findUserPostsById(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postsService.findUserPosts(userId, +page, +limit);
  }

  @ApiOperation({ summary: 'Get current user reposts' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('me/reposts')
  getMyReposts(
    @CurrentUser() user: { id: string },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postsService.findMyReposts(user.id, +page, +limit);
  }

  @ApiOperation({ summary: 'Get current user saved posts' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('me/saved')
  getMySavedPosts(
    @CurrentUser() user: { id: string },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postsService.findMySavedPosts(user.id, +page, +limit);
  }

  @ApiOperation({ summary: 'Get current user interactions' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/interactions')
  getMyInteractions(@CurrentUser() user: { id: string }) {
    return this.postsService.getUserInteractions(user.id);
  }

  @Public()
  @Get(':id/share')
  async sharePreview(@Param('id') id: string, @Res() response: Response) {
    const post = await this.postsService.findSharePreview(id);
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:5173';
    const postUrl = `${frontendUrl.replace(/\/$/, '')}/reviews/${post.id}`;
    const title = 'Ảnh chụp tại KH Booth';
    const description = post.caption || 'Xem ảnh của tôi tại KH Booth photobooth';
    const escapeHtml = (value: string) => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return response.type('html').send(`<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(post.cover_image_url)}">
    <meta property="og:image:secure_url" content="${escapeHtml(post.cover_image_url)}">
    <meta property="og:image:alt" content="Ảnh photobooth tại KH Booth">
    <meta property="og:url" content="${escapeHtml(postUrl)}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <p>Đang mở bài viết...</p>
    <script>window.location.replace(${JSON.stringify(postUrl)});</script>
    <noscript><a href="${escapeHtml(postUrl)}">Mở bài viết</a></noscript>
  </body>
</html>`);
  }

  @ApiOperation({ summary: 'Get post by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.toggleLike(id, user.id);
  }

  @ApiOperation({ summary: 'Toggle repost on a post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/repost')
  toggleRepost(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RepostDto,
  ) {
    return this.postsService.toggleRepost(id, user.id, dto);
  }

  @ApiOperation({ summary: 'Toggle save on a post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  toggleSave(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.toggleSave(id, user.id);
  }

  @ApiOperation({ summary: 'Update a post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user.id, updatePostDto);
  }

  @ApiOperation({ summary: 'Delete a post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.remove(id, user.id);
  }
}

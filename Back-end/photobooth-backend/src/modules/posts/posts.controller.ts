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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

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
  @Get()
  findFeed(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.postsService.findFeed(+page, +limit);
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

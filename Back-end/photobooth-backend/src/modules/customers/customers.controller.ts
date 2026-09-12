import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePhotoSessionDto } from './dto/create-photo-session.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() account: { id?: string }) {
    return this.customersService.findByAccountId(account.id || '');
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(
    @CurrentUser() account: { id?: string },
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateByAccountId(account.id || '', dto);
  }

  @Get('me/photo-history')
  @UseGuards(JwtAuthGuard)
  getMyPhotoHistory(
    @CurrentUser() account: { id?: string },
    @Query('type') type?: 'solo' | 'group',
    @Query('order') order: 'newest' | 'oldest' = 'newest',
  ) {
    return this.customersService.getPhotoHistory(account.id || '', type, order);
  }

  @Post('me/photo-history')
  @UseGuards(JwtAuthGuard)
  saveMyPhoto(
    @CurrentUser() account: { id?: string },
    @Body() dto: CreatePhotoSessionDto,
  ) {
    return this.customersService.savePhotoSession(account.id || '', dto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;
    return this.customersService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy hồ sơ khách hàng theo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Lấy hồ sơ khách hàng theo Account ID' })
  findByAccountId(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return this.customersService.findByAccountId(accountId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo hồ sơ khách hàng mới' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ khách hàng' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hồ sơ khách hàng' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}

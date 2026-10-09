import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomersService } from './customers.service';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';

@ApiTags('Admin / Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Lấy chỉ số tổng quan khách hàng' })
  getMetrics() {
    return this.customersService.getMetrics();
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất danh sách khách hàng ra CSV' })
  async exportCustomers(@Query() query: GetCustomersQueryDto, @Res() res: Response) {
    const csvStr = await this.customersService.exportCustomers(query);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="customers.csv"');
    return res.send(csvStr);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khách hàng (Dành cho Admin)' })
  findAll(@Query() query: GetCustomersQueryDto) {
    return this.customersService.findAllForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết khách hàng theo ID (Dành cho Admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/photo-history')
  @ApiOperation({ summary: 'Lấy lịch sử chụp ảnh của khách hàng' })
  async getPhotoHistory(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.customersService.findOne(id);
    if (!customer.account?.id) return { data: [], total: 0 };
    return this.customersService.getPhotoHistory(customer.account.id);
  }
}

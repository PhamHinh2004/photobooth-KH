import { Controller, Get, Query, UseGuards, Param, Patch, Body, Res, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AccountsService } from './accounts.service';
import { GetAccountsQueryDto } from './dto/get-accounts-query.dto';
import { Response } from 'express';

@ApiTags('Admin / Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Lấy số liệu tổng quan tài khoản',
  })
  getMetrics() {
    return this.accountsService.getMetrics();
  }

  @Get('export')
  @ApiOperation({
    summary: 'Xuất file CSV danh sách tài khoản theo bộ lọc',
  })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="accounts.csv"')
  async exportAccounts(@Query() query: GetAccountsQueryDto, @Res() res: Response) {
    const csv = await this.accountsService.exportAccounts(query);
    res.send(csv);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả tài khoản (Dành cho Admin)',
  })
  findAll(@Query() query: GetAccountsQueryDto) {
    return this.accountsService.findAllForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết tài khoản',
  })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái (Khóa / Mở khóa tài khoản)',
  })
  @ApiBody({ schema: { type: 'object', properties: { isActive: { type: 'boolean' } } } })
  updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.accountsService.update(id, { isActive });
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Cập nhật phân quyền / vai trò',
  })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: [Role.ADMIN, Role.STAFF, Role.CUSTOMER] } } } })
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.accountsService.update(id, { role });
  }
}

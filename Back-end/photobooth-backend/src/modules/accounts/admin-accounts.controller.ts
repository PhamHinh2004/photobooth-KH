import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AccountsService } from './accounts.service';
import { GetAccountsQueryDto } from './dto/get-accounts-query.dto';

@ApiTags('Admin / Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả tài khoản (Dành cho Admin)',
  })
  findAll(@Query() query: GetAccountsQueryDto) {
    return this.accountsService.findAllForAdmin(query);
  }
}

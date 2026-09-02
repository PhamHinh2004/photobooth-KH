import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/RolesGuard ';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email/Username đã tồn tại' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập (Trả về JWT accessToken)' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại (Yêu cầu JWT Token)' })
  @ApiResponse({ status: 200, description: 'Thông tin tài khoản hiện tại' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực hoặc Token không hợp lệ' })
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get('accounts')
  @Roles(Role.ADMIN) // Chỉ cho phép ADMIN truy cập
  @UseGuards(JwtAuthGuard, RolesGuard) // Xác thực trước, sau đó kiểm tra quyền
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách tài khoản (Yêu cầu JWT Token)' })
  @ApiResponse({ status: 200, description: 'Danh sách tài khoản' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực hoặc Token không hợp lệ' })
  getAccounts() {
    return this.authService.getAccounts();
  }
}

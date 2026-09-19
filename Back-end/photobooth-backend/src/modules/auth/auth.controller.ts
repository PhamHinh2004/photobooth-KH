import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  @Post('verify-registration-otp')
  @ApiOperation({ summary: 'Xác thực OTP đăng ký tài khoản' })
  async verifyRegistrationOtp(@Body() dto: VerifyRegistrationOtpDto) {
    return this.authService.verifyRegistrationOtp(dto);
  }

  @Post('resend-registration-otp')
  @ApiOperation({ summary: 'Gửi lại OTP đăng ký tài khoản' })
  async resendRegistrationOtp(@Body() dto: RegisterDto) {
    return this.authService.resendRegistrationOtp(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập (Trả về JWT accessToken)' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout() {
    return this.authService.logout();
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Gửi mã OTP đặt lại mật khẩu qua email' })
  @ApiResponse({ status: 200, description: 'Nếu email tồn tại, mã OTP đã được gửi' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('resend-forgot-password-otp')
  @ApiOperation({ summary: 'Gửi lại OTP quên mật khẩu' })
  async resendForgotPasswordOtp(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendForgotPasswordOtp(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Xác thực OTP đặt lại mật khẩu' })
  @ApiResponse({ status: 200, description: 'OTP hợp lệ và trả về reset token' })
  @ApiResponse({ status: 400, description: 'OTP không hợp lệ hoặc đã hết hạn' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt mật khẩu mới sau khi xác thực OTP' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Reset token không hợp lệ hoặc đã hết hạn' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản đang đăng nhập' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công',
    schema: { example: { message: 'Đổi mật khẩu thành công' } },
  })
  @ApiResponse({ status: 400, description: 'Mật khẩu mới không đủ mạnh hoặc xác nhận không khớp' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực hoặc mật khẩu hiện tại không đúng' })
  @ApiResponse({ status: 422, description: 'Mật khẩu mới không được giống mật khẩu cũ' })
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
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

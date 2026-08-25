import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from '../../../common/enums/gender.enum';

export class CreateCustomerDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'Account UUID' })
  @IsUUID('4', { message: 'accountId phải là định dạng UUID hợp lệ' })
  @IsNotEmpty({ message: 'accountId không được để trống' })
  accountId: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  @IsString({ message: 'fullName phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'fullName không được để trống' })
  fullName: string;

  @ApiPropertyOptional({ example: '1998-05-20', description: 'Ngày sinh (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'birthday phải theo định dạng YYYY-MM-DD' })
  birthday?: string;

  @ApiPropertyOptional({ example: 'Hà Nội', description: 'Thành phố' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: Gender, default: Gender.OTHERS, description: 'Giới tính' })
  @IsOptional()
  @IsEnum(Gender, { message: 'gender không hợp lệ' })
  gender?: Gender;
}

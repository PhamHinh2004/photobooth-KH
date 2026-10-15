import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Hội Bạn Thân', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(2)
  @Max(8)
  max_participants: number;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(3)
  @Max(15)
  @IsOptional()
  countdown_seconds?: number;
}

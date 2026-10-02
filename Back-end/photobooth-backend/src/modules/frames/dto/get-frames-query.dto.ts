import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFramesQueryDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsEnum(['single', 'group', 'both'])
  sessionType?: string;

  @IsOptional() 
  @Type(() => Number)
  @IsNumber() 
  @Min(0) 
  @Max(5)
  minRating?: number;

  @IsOptional() @IsIn(['rating', 'usage_count', 'created_at', 'sort_order'])
  sortBy?: string = 'sort_order';

  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

# API Spec — Quản lý tài khoản & khách hàng

Dựa trên schema hiện tại:
- `Account`: id, email, username, password, role, isActive, createdAt, updatedAt
- `Customer`: id, account_id (FK, nullable), is_created, full_name, birthday, city, gender, created_at, updated_at

---

## 1. GET `/admin/accounts` — Danh sách tài khoản

**Mô tả**: Lấy danh sách account (admin/staff) trong hệ thống, hỗ trợ phân trang, tìm kiếm, lọc.

**Yêu cầu**: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(Role.Admin)`

### Query params

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | number | Không (default 1) | Trang hiện tại |
| `limit` | number | Không (default 10) | Số bản ghi mỗi trang |
| `search` | string | Không | Tìm theo `email` hoặc `username` |
| `role` | enum(admin, staff) | Không | Lọc theo role |
| `isActive` | boolean | Không | Lọc theo trạng thái hoạt động |
| `sortBy` | string | Không (default `createdAt`) | Field để sắp xếp |
| `sortOrder` | enum(asc, desc) | Không (default `desc`) | Chiều sắp xếp |

### Response `200`

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "username": "admin01",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

> Lưu ý: **không trả `password`** trong bất kỳ response nào — cần loại bỏ field này ở tầng Service/Interceptor trước khi trả về.

### Response lỗi

| Status | Trường hợp |
|---|---|
| `401` | Chưa đăng nhập hoặc token không hợp lệ |
| `403` | Không có quyền admin |

---

## 2. GET `/admin/customers` — Danh sách khách hàng

**Mô tả**: Lấy danh sách khách hàng đã chụp ảnh. *(Đã xác nhận: phần này để triển khai sau — mục dưới đây giữ lại làm tham khảo thiết kế.)*

**Yêu cầu**: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(Role.Admin)`

### Query params

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | number | Không (default 1) | Trang hiện tại |
| `limit` | number | Không (default 10) | Số bản ghi mỗi trang |
| `search` | string | Không | Tìm theo `full_name` |
| `gender` | enum(male, female, other) | Không | Lọc theo giới tính |
| `hasAccount` | boolean | Không | `true` = khách đã liên kết account, `false` = khách vãng lai |
| `sortBy` | string | Không (default `created_at`) | Field để sắp xếp |
| `sortOrder` | enum(asc, desc) | Không (default `desc`) | Chiều sắp xếp |

### Response `200`

```json
{
  "data": [
    {
      "id": "uuid",
      "account_id": "uuid | null",
      "full_name": "Nguyễn Văn A",
      "birthday": "2000-05-10",
      "city": "Hồ Chí Minh",
      "gender": "male",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 10,
    "totalPages": 12
  }
}
```

---

## 3. GET `/admin/customers/:id` — Xem chi tiết khách hàng

**Mô tả**: Lấy đầy đủ thông tin 1 khách hàng cụ thể, kèm thông tin account liên kết (nếu có).

**Yêu cầu**: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(Role.Admin)`

### Path params

| Param | Kiểu | Mô tả |
|---|---|---|
| `id` | uuid | ID của customer |

### Response `200`

```json
{
  "id": "uuid",
  "account_id": "uuid | null",
  "is_created": false,
  "full_name": "Nguyễn Văn A",
  "birthday": "2000-05-10",
  "city": "Hồ Chí Minh",
  "gender": "male",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z",
  "account": {
    "id": "uuid",
    "email": "customer@example.com",
    "username": "customer01",
    "isActive": true
  }
}
```

> `account` trả về `null` nếu khách là **vãng lai** (chưa liên kết `Account`).

### Response lỗi

| Status | Trường hợp |
|---|---|
| `401` | Chưa đăng nhập hoặc token không hợp lệ |
| `403` | Không có quyền admin |
| `404` | Không tìm thấy customer với `id` tương ứng |

---

## Ghi chú triển khai (NestJS)

### DTO gợi ý

```typescript
// get-customers-query.dto.ts
export class GetCustomersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

  @IsOptional() @Type(() => Boolean)
  hasAccount?: boolean;
}
```

### Controller

```typescript
@Auth(Role.Admin) // decorator gộp JwtAuthGuard + RolesGuard + Roles
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query() query: GetCustomersQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }
}
```

### Service — ví dụ query kèm relation `account`

```typescript
async findOne(id: string) {
  const customer = await this.customerRepository.findOne({
    where: { id },
    relations: ['account'],
  });

  if (!customer) {
    throw new NotFoundException('Không tìm thấy khách hàng');
  }

  return customer;
}
```

### Loại bỏ `password` khỏi response `Account`

Dùng `class-transformer` với `@Exclude()` trên field `password` trong Entity, kết hợp `ClassSerializerInterceptor` global:

```typescript
@Exclude()
password: string;
```

```typescript
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

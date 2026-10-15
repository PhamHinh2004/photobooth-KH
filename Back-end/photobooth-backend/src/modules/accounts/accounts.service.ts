import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Customer } from '../customers/entities/customer.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { GetAccountsQueryDto } from './dto/get-accounts-query.dto';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * Lấy danh sách tất cả tài khoản (Phân trang & Tìm kiếm)
   * @param page Số trang
   * @param limit Số lượng bản ghi trên mỗi trang
   * @param role Vai trò tài khoản (tùy chọn)
   * @param search Từ khóa tìm kiếm (tùy chọn)
   * @returns Danh sách tài khoản và thông tin phân trang
   */
  async findAll(page = 1, limit = 10, role?: string, search?: string) {
    // generate query builder for accounts with optional role and search filters
    const query = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer')
      .orderBy('account.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (role) {
      query.andWhere('account.role = :role', { role });
    }

    if (search) {
      query.andWhere(
        '(account.email ILIKE :search OR account.username ILIKE :search OR customer.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForAdmin(queryDto: GetAccountsQueryDto) {
    const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
    
    const query = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer')
      .orderBy(`account.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (role) {
      query.andWhere('account.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('account.isActive = :isActive', { isActive });
    }

    if (search) {
      query.andWhere(
        '(account.email ILIKE :search OR account.username ILIKE :search OR customer.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMetrics() {
    const [total, active, locked, admin, staff, thisWeekTotal] = await Promise.all([
      this.accountRepository.count(),
      this.accountRepository.count({ where: { isActive: true } }),
      this.accountRepository.count({ where: { isActive: false } }),
      this.accountRepository.count({ where: { role: Role.ADMIN } }),
      this.accountRepository.count({ where: { role: Role.STAFF } }),
      this.accountRepository.count({
        where: {
          createdAt: MoreThanOrEqual(new Date(new Date().setDate(new Date().getDate() - 7))),
        },
      }),
    ]);

    return {
      total,
      active,
      locked,
      admin,
      staff,
      thisWeekTotal,
    };
  }

  async exportAccounts(queryDto: GetAccountsQueryDto) {
    const { search, role, isActive, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
    
    const query = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer')
      .orderBy(`account.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    if (role) {
      query.andWhere('account.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('account.isActive = :isActive', { isActive });
    }

    if (search) {
      query.andWhere(
        '(account.email ILIKE :search OR account.username ILIKE :search OR customer.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const data = await query.getMany();
    
    const headers = ['ID', 'Email', 'Username', 'Vai Trò', 'Trạng Thái', 'Ngày Tạo'];
    const csvRows = [headers.join(',')];
    
    for (const account of data) {
      const row = [
        account.id,
        account.email,
        account.username,
        account.role,
        account.isActive ? 'Đang hoạt động' : 'Đã khóa',
        account.createdAt ? account.createdAt.toISOString() : ''
      ];
      csvRows.push(row.map(v => `"${v}"`).join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Lấy thông tin tài khoản theo ID
   * @param id ID của tài khoản
   * @returns Thông tin tài khoản
   */
  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: { customer: true },
    });

    if (!account) {
      throw new NotFoundException(`Tài khoản với ID ${id} không tồn tại`);
    }

    return account;
  }

  /**
   * Lấy thông tin tài khoản theo email
   * @param email Email của tài khoản
   * @returns Thông tin tài khoản hoặc null nếu không tìm thấy
   */
  async findByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
      },
      relations: { customer: true },
    });
  }

  /**
   * Tạo mới một tài khoản
   * @param dto Dữ liệu tạo tài khoản
   * @returns Thông báo kết quả
   */
  async create(dto: CreateAccountDto): Promise<{message: string}> {
    const existingEmail = await this.accountRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    const existingUsername = await this.accountRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username đã tồn tại trong hệ thống');
    }

    const hashedPassword = await bcrypt.hash(dto.password || '', 10);

    const account = this.accountRepository.create({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      role: dto.role,
    });

    await this.accountRepository.save(account);
    return { message: 'Tạo tài khoản thành công' };
  }

  /**
   * Cập nhật thông tin tài khoản
   * @param id ID của tài khoản
   * @param dto Dữ liệu cập nhật
   * @returns Thông báo kết quả
   */
  async update(id: string, dto: UpdateAccountDto): Promise<{message: string}> {
    const account = await this.findOne(id);
    
    // Check if the email is being updated and if it already exists
    if (dto.email && dto.email !== account.email) {
      const existingEmail = await this.accountRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
      account.email = dto.email;
    }

    if (dto.role) {
      account.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      account.isActive = dto.isActive;
    }

    await this.accountRepository.save(account);
    return { message: 'Cập nhật tài khoản thành công' };
  }

  /**
   * Đổi mật khẩu tài khoản
   * @param id ID của tài khoản
   * @param dto Dữ liệu đổi mật khẩu
   * @returns Thông báo kết quả
   */
  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const account = await this.accountRepository.findOne({
      where: { id },
      select: { id: true, password: true },
    });

    if (!account) {
      throw new NotFoundException(`Tài khoản không tồn tại`);
    }

    const isMatch = await bcrypt.compare(dto.oldPassword || '', account.password || '');
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    account.password = await bcrypt.hash(dto.newPassword || '', 10);
    await this.accountRepository.save(account);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Xóa tài khoản
   * @param id ID của tài khoản
   * @returns Thông báo kết quả
   */
  async remove(id: string): Promise<{ message: string }> {
    const account = await this.findOne(id);
    await this.accountRepository.remove(account);
    return { message: 'Đã xóa tài khoản thành công' };
  }
}

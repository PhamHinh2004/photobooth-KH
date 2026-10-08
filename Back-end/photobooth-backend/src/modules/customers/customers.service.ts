/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { PhotoSession } from './entities/photo-session.entity';
import { CreatePhotoSessionDto } from './dto/create-photo-session.dto';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(PhotoSession)
    private readonly photoSessionRepository: Repository<PhotoSession>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * get all customers with pagination and optional search
   * @param page 
   * @param limit 
   * @param search 
   * @returns 
   */
  async findAll(page = 1, limit = 10, search?: string) {
    const query = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.account', 'account')
      .orderBy('customer.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.where(
        'customer.fullName ILIKE :search OR customer.city ILIKE :search OR account.email ILIKE :search',
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

  async findAllForAdmin(queryDto: GetCustomersQueryDto) {
    const { page = 1, limit = 10, search, gender, hasAccount, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const query = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.account', 'account')
      .orderBy(`customer.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (gender) {
      query.andWhere('customer.gender = :gender', { gender });
    }

    if (hasAccount !== undefined) {
      if (hasAccount) {
        query.andWhere('customer.account_id IS NOT NULL');
      } else {
        query.andWhere('customer.account_id IS NULL');
      }
    }

    if (search) {
      query.andWhere(
        '(customer.fullName ILIKE :search OR customer.city ILIKE :search OR account.email ILIKE :search)',
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

  /**
   * get customer by id
   * @param id 
   * @returns 
   */
  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: { account: true },
    });

    if (!customer) {
      throw new NotFoundException(
        `Hồ sơ khách hàng với ID ${id} không tồn tại`,
      );
    }

    return customer;
  }

  /**
   * 
   * @param accountId 
   * @returns 
   */
  async findByAccountId(accountId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { account: { id: accountId } },
      relations: { account: true },
    });

    if (!customer) {
      throw new NotFoundException(
        `Không tìm thấy thông tin khách hàng cho tài khoản ${accountId}`,
      );
    }

    return customer;
  }

  /**
   * 
   * @param dto 
   * @returns 
   */
  async create(dto: CreateCustomerDto): Promise<{message: string}> {
    const account = await this.accountRepository.findOne({
      where: { id: dto.accountId },
    });

    if (!account) {
      throw new NotFoundException(
        `Tài khoản với ID ${dto.accountId} không tồn tại`,
      );
    }

    const existingCustomer = await this.customerRepository.findOne({
      where: { account: { id: dto.accountId } },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Tài khoản này đã được liên kết với một hồ sơ khách hàng',
      );
    }

    const customer = this.customerRepository.create({
      account: { id: dto.accountId },
      fullName: dto.fullName,
      birthday: dto.birthday,
      city: dto.city,
      gender: dto.gender,
    });

    await this.customerRepository.save(customer);
    return { message: 'Tạo hồ sơ khách hàng thành công' };
  }

  async update(id: string, dto: UpdateCustomerDto, file?: Express.Multer.File): Promise<Customer> {
    const customer = await this.findOne(id);

    if (dto.fullName !== undefined) customer.fullName = dto.fullName;
    if (dto.birthday !== undefined) customer.birthday = dto.birthday;
    if (dto.city !== undefined) customer.city = dto.city;
    if (dto.gender !== undefined) customer.gender = dto.gender;

    // Set is_created to true when updating profile
    customer.iscreated = true;

    if (file) {
      const filenameParts = file.originalname.split('.');
      const ext = filenameParts.length > 1 ? filenameParts.pop()! : 'jpg';
      const publicUrl = await this.storageService.uploadFile('profile', file.buffer, ext);
      
      // Optionally delete old image if it's not a default one
      if (
        customer.image &&
        !customer.image.includes('woman_profile.jpg') &&
        !customer.image.includes('man_profile.jpg')
      ) {
        await this.storageService.deleteFile(customer.image).catch(() => {});
      }
      
      customer.image = publicUrl;
    } else if (dto.image !== undefined) {
      customer.image = dto.image;
    }

    // Apply default image based on gender if image is empty or still using a default one
    if (
      !customer.image || 
      customer.image.includes('woman_profile.jpg') || 
      customer.image.includes('man_profile.jpg')
    ) {
      if (customer.gender === 'female' as any) {
        customer.image = 'https://pub-4eb303709ef24609a3b420990203812a.r2.dev/profile/woman_profile.jpg';
      } else {
        customer.image = 'https://pub-4eb303709ef24609a3b420990203812a.r2.dev/profile/man_profile.jpg';
      }
    }

    await this.customerRepository.save(customer);
    return this.findOne(id);
  }

  async updateByAccountId(accountId: string, dto: UpdateCustomerDto, file?: Express.Multer.File): Promise<Customer> {
    const customer = await this.findByAccountId(accountId);
    return this.update(customer.id || '', dto, file);
  }

  async getPhotoHistory(accountId: string, type?: 'solo' | 'group', order: 'newest' | 'oldest' = 'newest') {
    const query = this.photoSessionRepository
      .createQueryBuilder('photo')
      .where('photo.account_id = :accountId', { accountId })
      .orderBy('photo.created_at', order === 'oldest' ? 'ASC' : 'DESC');

    if (type) query.andWhere('photo.session_type = :type', { type });
    const photos = await query.getMany();
    return { data: photos, total: photos.length };
  }

  async savePhotoSession(accountId: string, dto: CreatePhotoSessionDto) {
    const photo = this.photoSessionRepository.create({ accountId, ...dto });
    return this.photoSessionRepository.save(photo);
  }

  async ensurePhotoSession(accountId: string, dto: CreatePhotoSessionDto) {
    const existing = await this.photoSessionRepository.findOne({
      where: { accountId, sessionType: dto.sessionType, imageUrl: dto.imageUrl },
    });
    return existing ?? this.savePhotoSession(accountId, dto);
  }

  async remove(id: string): Promise<{ message: string }> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
    return { message: 'Đã xóa hồ sơ khách hàng thành công' };
  }
}

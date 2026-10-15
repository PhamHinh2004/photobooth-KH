import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { Account } from '../accounts/entities/account.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      is_read: false,
    });
    const saved = await this.notificationRepository.save(notification);

    const notificationWithRelations = await this.notificationRepository.findOne({
      where: { id: saved.id },
      relations: {
        recipient: true,
        actor: { customer: true },
      },
    });

    this.eventEmitter.emit('notification.created', notificationWithRelations);
    return notificationWithRelations!;
  }

  async findByRecipient(recipientAccountId: string, page = 1, limit = 20) {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { recipient_account_id: recipientAccountId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        actor: { customer: true },
      },
    });

    const unreadCount = await this.notificationRepository.count({
      where: { recipient_account_id: recipientAccountId, is_read: false },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  async countUnread(recipientAccountId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { recipient_account_id: recipientAccountId, is_read: false },
    });
    return { count };
  }

  async markAsRead(id: string, recipientAccountId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipient_account_id: recipientAccountId },
      relations: {
        actor: { customer: true },
      },
    });
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    if (!notification.is_read) {
      notification.is_read = true;
      notification.read_at = new Date();
      await this.notificationRepository.save(notification);
      this.eventEmitter.emit('notification.read', { accountId: recipientAccountId, id });
    }

    return notification;
  }

  async markAllAsRead(recipientAccountId: string) {
    await this.notificationRepository.update(
      { recipient_account_id: recipientAccountId, is_read: false },
      { is_read: true, read_at: new Date() },
    );

    this.eventEmitter.emit('notification.read_all', { accountId: recipientAccountId });
    return { success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
  }

  async remove(id: string, recipientAccountId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipient_account_id: recipientAccountId },
    });
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    await this.notificationRepository.remove(notification);
    return { success: true, message: 'Đã xóa thông báo' };
  }

  async broadcast(dto: BroadcastNotificationDto, adminAccountId?: string) {
    if (dto.recipientAccountId) {
      const created = await this.create({
        recipient_account_id: dto.recipientAccountId,
        actor_account_id: adminAccountId ?? null,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: dto.title,
        message: dto.message,
        action_url: dto.action_url ?? null,
      });
      return { totalSent: 1, notification: created };
    }

    const query: any = { isActive: true };
    if (dto.targetRole) {
      query.role = dto.targetRole;
    }
    const accounts = await this.accountRepository.find({
      where: query,
      select: { id: true },
    });

    for (const acc of accounts) {
      if (acc.id) {
        await this.create({
          recipient_account_id: acc.id,
          actor_account_id: adminAccountId ?? null,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: dto.title,
          message: dto.message,
          action_url: dto.action_url ?? null,
        });
      }
    }

    return { totalSent: accounts.length };
  }
}

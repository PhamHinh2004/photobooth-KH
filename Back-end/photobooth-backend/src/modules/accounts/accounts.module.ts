import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { AdminAccountsController } from './admin-accounts.controller';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';

// This module is responsible for managing accounts and their related operations.
@Module({
  imports: [TypeOrmModule.forFeature([Account, Customer])],
  controllers: [AccountsController, AdminAccountsController],
  providers: [AccountsService],
  exports: [AccountsService, TypeOrmModule],
})
export class AccountsModule {}

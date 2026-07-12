import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { SequenceService } from '../../common/sequence.service';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, SequenceService],
  exports: [AccountingService],
})
export class AccountingModule {}

import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { SequenceService } from '../../common/sequence.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, SequenceService],
  exports: [InventoryService],
})
export class InventoryModule {}

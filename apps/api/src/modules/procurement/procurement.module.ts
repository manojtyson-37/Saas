import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { SequenceService } from '../../common/sequence.service';

@Module({
  controllers: [ProcurementController],
  providers: [ProcurementService, SequenceService],
  exports: [ProcurementService],
})
export class ProcurementModule {}

import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { SequenceService } from '../../common/sequence.service';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, SequenceService],
  exports: [ProductionService],
})
export class ProductionModule {}

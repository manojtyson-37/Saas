import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { SequenceService } from '../../common/sequence.service';

@Module({
  controllers: [PosController],
  providers: [PosService, SequenceService],
  exports: [PosService],
})
export class PosModule {}

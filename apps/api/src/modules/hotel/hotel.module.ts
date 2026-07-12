import { Module } from '@nestjs/common';
import { HotelController } from './hotel.controller';
import { HotelService } from './hotel.service';
import { SequenceService } from '../../common/sequence.service';

@Module({
  controllers: [HotelController],
  providers: [HotelService, SequenceService],
  exports: [HotelService],
})
export class HotelModule {}

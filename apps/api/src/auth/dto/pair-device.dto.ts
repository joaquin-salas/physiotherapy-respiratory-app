import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Body of POST /auth/pair, sent by the patient app */
export class PairDeviceDto {
  /** The code from the connection sheet, scanned or typed ("K7QM4-XPT9W") */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  /** Shown to the physio, e.g. "Android" */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;
}

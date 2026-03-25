import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  // ─── Store Info ────────────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() storeName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storeEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storeAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;

  // ─── Currency ──────────────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() defaultCurrency?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['before', 'after']) currencySymbolPosition?: 'before' | 'after';
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(4) currencyDecimalPlaces?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() thousandsSeparator?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decimalSeparator?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supportedCurrencies?: string;

  // ─── Receipt ───────────────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() receiptHeader?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() receiptFooter?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() receiptShowLogo?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() orderNumberPrefix?: string;

  // ─── Payment Methods ───────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethods?: string;

  // ─── Inventory ─────────────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(9999) lowStockThreshold?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() trackInventory?: boolean;
}

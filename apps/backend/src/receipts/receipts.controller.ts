import { Controller, Get, Param, NotFoundException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReceiptsService } from './receipts.service';

@ApiTags('receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get receipt JSON by token (no auth required)' })
  @ApiParam({ name: 'token', type: String })
  async getReceiptJson(@Param('token') token: string) {
    const data = await this.receiptsService.getReceiptByToken(token);
    if (!data) throw new NotFoundException('Receipt not found or expired');
    return data;
  }

  @Get('html/:token')
  @ApiOperation({ summary: 'Get receipt as printable HTML (no auth required)' })
  @ApiParam({ name: 'token', type: String })
  async getReceiptHtml(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.receiptsService.getReceiptByToken(token);
    if (!data) throw new NotFoundException('Receipt not found or expired');
    const html = this.receiptsService.renderReceiptHtml(data);
    res.setHeader('Content-Type', 'text/html').send(html);
  }
}

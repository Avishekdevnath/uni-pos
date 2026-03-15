import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; data: { service: string } } {
    return {
      status: 'success',
      data: {
        service: 'backend',
      },
    };
  }
}

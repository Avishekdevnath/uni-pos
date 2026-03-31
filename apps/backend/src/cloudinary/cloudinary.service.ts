import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key:    this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadProductImage(
    file: Express.Multer.File,
    productId: string,
  ): Promise<string> {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: jpeg, png, webp, gif`);
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder:          'uni-pos/products',
          public_id:       `product_${productId}`,
          overwrite:       true,
          transformation:  [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            reject(new InternalServerErrorException('Cloudinary upload failed'));
          } else {
            resolve(result.secure_url);
          }
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(upload);
    });
  }

  async deleteProductImage(productId: string): Promise<void> {
    await cloudinary.uploader.destroy(`uni-pos/products/product_${productId}`);
  }
}

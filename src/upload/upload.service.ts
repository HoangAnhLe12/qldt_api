import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private uploadPath = './uploads'; // Thư mục lưu file

  constructor() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const allowedFileTypes = ['.jpg', '.jpeg', '.pdf', '.docx'];
    const maxFileSize = {
      '.jpg': 10 * 1024 * 1024, // 10MB
      '.jpeg': 10 * 1024 * 1024,
      '.pdf': 5 * 1024 * 1024, // 5MB
      '.docx': 5 * 1024 * 1024,
    };

    const fileExtension = extname(file.originalname).toLowerCase();

    // Kiểm tra loại file
    if (!allowedFileTypes.includes(fileExtension)) {
      throw new HttpException(
        `File type not allowed: ${fileExtension}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra dung lượng
    if (file.size > maxFileSize[fileExtension]) {
      throw new HttpException(
        `File size exceeds limit for ${fileExtension}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const maxFileNameLength = 25;
    const originalName = file.originalname.replace(/\s+/g, '_');
    const shortFileName = originalName.slice(0, maxFileNameLength);
    const timestamp = Date.now(); // Sử dụng thời gian hiện tại
    const fileName = `${timestamp}_${shortFileName}`;
    const filePath = `${this.uploadPath}/${fileName}`;

    fs.writeFileSync(filePath, file.buffer);

    return fileName; // Trả về tên file để lưu vào DB
  }

  getFileUrl(fileName: string): string {
    return `${process.env.BASE_URL || 'http://localhost:3005'}/uploads/${fileName}`;
  }
}

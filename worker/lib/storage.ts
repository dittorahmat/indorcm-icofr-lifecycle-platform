import type { Context } from 'hono';

export interface StorageObject {
  body: any;
  httpEtag: string;
  writeHttpMetadata: (headers: Headers) => void;
}

export interface StorageBucket {
  put(key: string, body: ArrayBuffer | ArrayBufferView | string, options?: any): Promise<any>;
  get(key: string): Promise<StorageObject | null>;
  delete(key: string): Promise<void>;
}

// Emulate R2 bucket on local filesystem for on-premise Node.js runtime
class LocalStorageBucket implements StorageBucket {
  private baseDir: string;

  constructor() {
    this.baseDir = 'uploads';
  }

  private async getFs() {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const { existsSync } = await import('node:fs');
    return { fs, path, existsSync };
  }

  private async getSanitizedPath(key: string): Promise<string> {
    const { path } = await this.getFs();
    const rootDir = path.resolve(process.cwd(), this.baseDir);
    const resolvedPath = path.resolve(rootDir, key);
    if (!resolvedPath.startsWith(rootDir + path.sep) && resolvedPath !== rootDir) {
      throw new Error('Access denied: Path traversal detected');
    }
    return resolvedPath;
  }

  async put(key: string, body: ArrayBuffer | ArrayBufferView | string, options?: any): Promise<any> {
    const { fs, path } = await this.getFs();
    const filePath = await this.getSanitizedPath(key);
    const fileDir = path.dirname(filePath);
    
    await fs.mkdir(fileDir, { recursive: true });

    let buffer: Buffer;
    if (body instanceof ArrayBuffer) {
      buffer = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      buffer = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else {
      buffer = Buffer.from(body);
    }

    await fs.writeFile(filePath, buffer);
    return { key };
  }

  async get(key: string): Promise<StorageObject | null> {
    const { fs, existsSync } = await this.getFs();
    const filePath = await this.getSanitizedPath(key);
    if (!existsSync(filePath)) {
      return null;
    }

    const stat = await fs.stat(filePath);
    const fileBuffer = await fs.readFile(filePath);

    // Guess content-type based on key extension
    let contentType = 'application/octet-stream';
    const lowerKey = key.toLowerCase();
    if (lowerKey.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (lowerKey.endsWith('.png')) {
      contentType = 'image/png';
    } else if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (lowerKey.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (lowerKey.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    } else if (lowerKey.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (lowerKey.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (lowerKey.endsWith('.doc')) {
      contentType = 'application/msword';
    } else if (lowerKey.endsWith('.xlsx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (lowerKey.endsWith('.xls')) {
      contentType = 'application/vnd.ms-excel';
    } else if (lowerKey.endsWith('.csv')) {
      contentType = 'text/csv';
    } else if (lowerKey.endsWith('.txt')) {
      contentType = 'text/plain';
    } else if (lowerKey.endsWith('.zip')) {
      contentType = 'application/zip';
    }

    return {
      body: fileBuffer,
      httpEtag: `local-${stat.mtimeMs}-${stat.size}`,
      writeHttpMetadata: (headers: Headers) => {
        headers.set('Content-Type', contentType);
        headers.set('Content-Length', stat.size.toString());
      }
    };
  }

  async delete(key: string): Promise<void> {
    const { fs, existsSync } = await this.getFs();
    const filePath = await this.getSanitizedPath(key);
    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }
  }
}

export const getStorageBucket = (c: Context<any>): StorageBucket => {
  if (c.env && c.env.DOCUMENTS_BUCKET) {
    return c.env.DOCUMENTS_BUCKET;
  }
  return new LocalStorageBucket();
};

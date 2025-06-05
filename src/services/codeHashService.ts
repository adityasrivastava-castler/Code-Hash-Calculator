import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileInfo } from '../types';

class CodeHashService {
    async hashFile(filePath: string): Promise<{ hash: string }> {
        const fileBuffer = await fs.readFile(filePath);
        return this.hashAny(fileBuffer);
    }

    async hashAny(buffer: Buffer): Promise<{ hash: string }> {
        const hash = crypto.createHash('sha256');
        hash.update(buffer);
        return { hash: hash.digest('hex') };
    }
}

export const codeHashService = new CodeHashService(); 
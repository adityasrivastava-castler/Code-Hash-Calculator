export interface FileInfo {
    filePath: string;
    fileSize: number;
    fileExtension: string;
    encrypted: boolean;
    encryptionType: string;
    hash: string;
}

export interface BufferFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    path?: string;
} 
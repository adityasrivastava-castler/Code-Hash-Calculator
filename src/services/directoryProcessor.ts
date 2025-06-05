import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as unzipper from 'unzipper';
import { FileInfo, BufferFile } from '../types';
import { codeHashService } from './codeHashService';

export const listFilesAndDirs = async (directory: string | BufferFile | any): Promise<{ totalHash: string }> => {
    let filesList: FileInfo[] = [];
    const directoryHash = crypto.createHash('sha256');

    if (typeof directory === 'object') {
        filesList = (await processZipDirectory(directory)).files;
    } else if (typeof directory === 'string') {
        filesList = (await processFsDirectory(directory)).files;
    } else {
        throw new TypeError('Expected directory to be either a string or an object with a buffer');
    }

    const sortedHashes = filesList.map(file => file.hash).sort();
    directoryHash.update(sortedHashes.join(''));

    return {
        totalHash: directoryHash.digest('hex')
    };
};

export const processZipDirectory = async (directory: BufferFile | any): Promise<{ files: FileInfo[]; }> => {
    let filesList: FileInfo[] = [];
    try {
        let zip;
        if (directory.path) {
            zip = await unzipper.Open.file(directory.path);
        } else {
            const buffer = Buffer.isBuffer(directory.buffer)
                ? directory.buffer
                : Buffer.from(new Uint8Array(directory.buffer));
            zip = await unzipper.Open.buffer(buffer);
        }

        const chunkSize = Number.parseInt(process.env.FILE_LIMIT || '100');
        for (let i = 0; i < zip.files.length; i += chunkSize) {
            const chunk = zip.files.slice(i, i + chunkSize);

            for (const entry of chunk) {
                try {
                    if (entry.path.includes('/.git/') || entry.path.startsWith('.git/')) {
                        continue;
                    }

                    if (entry.type === 'Directory') {
                        const childEntries = await entry.buffer();
                        if (childEntries.length > 0) {
                            const childResult = await processZipDirectory({
                                fieldname: entry.path,
                                originalname: entry.path,
                                encoding: '',
                                mimetype: '',
                                buffer: childEntries,
                                size: childEntries.length,
                            });
                            filesList = filesList.concat(childResult.files);
                        }
                        continue;
                    }

                    const fileName = entry.path;
                    const fileSize = entry.uncompressedSize;
                    const fileExtension = path.extname(fileName);

                    const fileBuffer = await entry.buffer();
                    const fileHash = await codeHashService.hashAny(fileBuffer);

                    filesList.push({
                        filePath: fileName,
                        fileSize: fileSize,
                        fileExtension: fileExtension,
                        encrypted: false,
                        encryptionType: 'None',
                        hash: fileHash.hash
                    });

                    if (global.gc) {
                        global.gc();
                    }
                } catch (entryError) {
                    console.error(`Error processing entry ${entry.path}:`, entryError);
                    continue;
                }
            }
        }
    } catch (zipError) {
        console.error('Error processing zip file:', zipError);
        throw zipError;
    }
    return {
        files: filesList
    }
};

export const processFsDirectory = async (directory: string): Promise<{files: FileInfo[]}> => {
    let filesList: FileInfo[] = [];
    try {
        const files = await fs.readdir(directory);

        for (const file of files) {
            try {
                const filePath = path.join(directory, file);
                const stats = await fs.stat(filePath);

                if (file === '.git' || filePath.includes('/.git/')) {
                    continue;
                }

                if (stats.isDirectory()) {
                    const childResult = await processFsDirectory(filePath);
                    filesList = filesList.concat(childResult.files);
                    continue;
                }

                const fileExtension = path.extname(file);
                const fileHash = await codeHashService.hashFile(filePath);

                filesList.push({
                    filePath,
                    fileSize: stats.size,
                    fileExtension,
                    encrypted: false,
                    encryptionType: 'None',
                    hash: fileHash.hash
                });
            } catch (fileError) {
                console.error(`Error processing file ${file}:`, fileError);
                continue;
            }
        }
    } catch (dirError) {
        console.error(`Error reading directory ${directory}:`, dirError);
        throw dirError;
    }
    return {
        files: filesList,
    }
}; 
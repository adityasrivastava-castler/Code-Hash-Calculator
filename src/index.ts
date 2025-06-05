import express from 'express';
import multer from 'multer';
import { listFilesAndDirs } from './services/directoryProcessor';

const app = express();
const port = process.env.PORT || 3002;

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await listFilesAndDirs(req.file);
        res.json(result);
    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: 'Error processing file' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 
# Code Hasher

A service that calculates SHA-256 hashes for files within a zip archive.

## Features

- Upload zip files and calculate individual file hashes
- Calculate a total hash for the entire directory structure
- Skip .git directories
- Process files in chunks to manage memory usage
- Support for both zip files and local directories

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will start on port 3002 by default.

## Usage

### Upload a Zip File

Send a POST request to `/upload` with a zip file in the request body:

```bash
curl -X POST -F "file=@your-file.zip" http://localhost:3002/upload
```

Or use Postman:
1. Create a new POST request to `http://localhost:3002/upload`
2. In the request body, select "form-data"
3. Add a key named "file" and select "File" as the type
4. Choose your zip file
5. Send the request

### Response Format

The response will include:
- `totalHash`: SHA-256 hash of the entire directory structure

Example response:
```json
{
  "totalHash": "def456..."
}
```

## Environment Variables

- `PORT`: Server port (default: 3002)
- `FILE_LIMIT`: Number of files to process in each chunk (default: 100) 

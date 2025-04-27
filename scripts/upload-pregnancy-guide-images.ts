import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const BUCKET = 'aio-pregnancy-guide-images';
const IMAGE_DIR = path.join(__dirname, '../pregnancy-guide-images');

const s3 = new S3Client({ region: 'us-east-2' });

async function uploadImage(file: string) {
  const filePath = path.join(IMAGE_DIR, file);
  const fileStream = fs.createReadStream(filePath);
  const ext = path.extname(file).toLowerCase();
  const contentType = ext === '.svg' ? 'image/svg+xml' : 'image/png';
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: file,
    Body: fileStream,
    ContentType: contentType,
  });
  await s3.send(command);
  console.log(`Uploaded ${file} to s3://${BUCKET}/${file}`);
}

async function main() {
  const files = fs
    .readdirSync(IMAGE_DIR)
    .filter((f) => f.endsWith('.svg') || f.endsWith('.png'));
  if (files.length === 0) {
    console.log('No SVG or PNG images found to upload.');
    return;
  }
  for (const file of files) {
    await uploadImage(file);
  }
  console.log('All images uploaded.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

Gestionar cargas de archivos (S3)

---
description: Setup secure file uploads to AWS S3
---

1. **Install AWS SDK**:
   - Install the S3 client and presigner.
   // turbo
   - Run `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

2. **Create Presigned URL (Server Action)**:
   - Generate a presigned URL on the server for direct client uploads.
   ```ts
   'use server'
   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

   const s3Client = new S3Client({
     region: process.env.AWS_REGION!,
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });

   export async function getUploadUrl(filename: string, contentType: string) {
     const command = new PutObjectCommand({
       Bucket: process.env.AWS_BUCKET_NAME!,
       Key: `uploads/${Date.now()}-${filename}`,
       ContentType: contentType,
     });

     const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
     return url;
   }
   ```

3. **Upload from Client**:
   - Use the presigned URL to upload directly to S3.
   ```tsx
   async function handleUpload(file: File) {
     const uploadUrl = await getUploadUrl(file.name, file.type);
     await fetch(uploadUrl, {

   
   
     
       method: 'PUT',
       body: file,
       headers: { 'Content-Type': file.type },
     });
   }
   ```

4. **Pro Tips**:
   - Configure CORS on your S3 bucket: allow PUT from your domain.
   - Use presigned URLs to avoid exposing AWS credentials to clients.
   - Set expiration times (3600s = 1 hour) to limit upload window.


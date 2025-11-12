// utils/s3Uploader.ts
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

export const uploadToS3 = async (file: Express.Multer.File) => {
  const fileKey = `documents/${uuidv4()}_${path.basename(file.originalname)}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
};

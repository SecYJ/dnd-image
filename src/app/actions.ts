"use server";

import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { promisify } from "util";

const RANDOM_BYTES = promisify(crypto.randomBytes);
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const generateUploadURL = async () => {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: "test",
    });

    const url = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 60, // 1 hour
    });

    return url;
};

export async function uploadImagesToS3(formData: FormData) {
    try {
        const imageFiles = formData.getAll("images") as File[];

        const fileNames: string[] = [];

        for (const file of imageFiles) {
            const buffer = await file.arrayBuffer();
            const rawBytes = (await RANDOM_BYTES(16)).toString("hex");
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `Room.jpeg/${rawBytes}`,
                Body: Buffer.from(buffer),
                ContentType: file.type,
            });
            await s3Client.send(command);
            fileNames.push(file.name);
        }

        return fileNames;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw new Error("Failed to upload image to S3");
    }
}

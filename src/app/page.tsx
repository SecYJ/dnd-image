// app/components/ImageUploadForm.tsx
"use client";

import { UploadIcon, UserIcon, XIcon } from "lucide-react";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { z } from "zod";
import { uploadImagesToS3 } from "./actions";

const MAX_FILE_SIZE = 300 * 1024; // 300KB in bytes
const MAX_IMAGES = 5;

// Zod schema for file validation
const fileSchema = z
    .instanceof(File)
    .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "Image must be less than 300KB",
    );

interface FormData {
    username: string;
    images: File[];
}

interface Preview {
    file: File;
    url: string;
}

export default function ImageUploadForm() {
    const [formData, setFormData] = useState<FormData>({
        username: "",
        images: [],
    });
    const [previews, setPreviews] = useState<Preview[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.username || formData.images.length === 0) {
            setErrors(["Please provide a username and at least one image"]);
            return;
        }

        setIsUploading(true);
        setErrors([]);

        try {
            const data = new FormData();
            data.append("username", formData.username);
            formData.images.forEach((image) => data.append("images", image));

            const fileNames = await uploadImagesToS3(data);

            console.log("fileNames", fileNames);

            // setUploadedUrls(imageUrls);
            alert("Upload successful!");

            // Clear form after successful upload
            setFormData({ username: "", images: [] });
            setPreviews([]);
        } catch (error) {
            console.error("Upload failed:", error);
            setErrors([
                error instanceof Error ? error.message : "Upload failed!",
            ]);
        } finally {
            setIsUploading(false);
        }
    };

    // Validate and process files
    const processFiles = (files: FileList) => {
        const newFiles = Array.from(files).slice(
            0,
            MAX_IMAGES - formData.images.length,
        );
        const validationErrors: string[] = [];
        const validFiles: File[] = [];
        const newPreviews: Preview[] = [];

        newFiles.forEach((file) => {
            const result = fileSchema.safeParse(file);
            if (result.success) {
                validFiles.push(file);
                newPreviews.push({ file, url: URL.createObjectURL(file) });
            } else {
                validationErrors.push(
                    `${file.name}: ${result.error.issues[0].message}`,
                );
            }
        });

        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...validFiles],
        }));
        setPreviews((prev) => [...prev, ...newPreviews]);
        setErrors(validationErrors);
    };

    // Handle file drop
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
        }
    };

    // Handle file input change
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
        }
    };

    // Remove image
    const removeImage = (index: number) => {
        URL.revokeObjectURL(previews[index].url);
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle drag events
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"
            >
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
                    Upload Your Images
                </h2>

                {/* Username Input */}
                <div className="mb-6">
                    <label
                        htmlFor="username"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Username
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    username: e.target.value,
                                }))
                            }
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your username"
                        />
                    </div>
                </div>

                {/* Image Upload Area */}
                <div
                    className={`mb-6 rounded-lg border-2 border-dashed p-6 transition-colors ${
                        dragActive
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-300 bg-gray-50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {previews.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={preview.url}
                                        alt={`Preview ${index}`}
                                        className="max-h-32 w-full rounded-lg object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                                Drag and drop up to {MAX_IMAGES} images (max
                                300KB each) or
                            </p>
                            <label
                                htmlFor="image-upload"
                                className="mt-2 inline-block cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
                            >
                                Select Images
                            </label>
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={formData.images.length >= MAX_IMAGES}
                            />
                        </div>
                    )}
                </div>

                {/* Error Messages */}
                {errors.length > 0 && (
                    <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                        <ul className="list-disc pl-5">
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Status Message */}
                <p className="mb-4 text-sm text-gray-600">
                    {formData.images.length}/{MAX_IMAGES} images selected
                </p>

                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={isUploading || formData.images.length === 0}
                        className={`flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            isUploading || formData.images.length === 0
                                ? "cursor-not-allowed opacity-50"
                                : ""
                        }`}
                    >
                        {isUploading ? (
                            <>
                                <svg
                                    className="mr-2 h-5 w-5 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <UploadIcon className="mr-2 h-5 w-5" />
                                Upload Images
                            </>
                        )}
                    </button>
                </div>

                {/* Uploaded images */}
                {uploadedUrls.length > 0 && (
                    <div className="mt-6">
                        <h3 className="mb-2 text-lg font-medium text-gray-900">
                            Uploaded Images
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {uploadedUrls.map((url, index) => (
                                <div
                                    key={index}
                                    className="relative overflow-hidden rounded-lg"
                                >
                                    <img
                                        src={url}
                                        alt={`Uploaded ${index + 1}`}
                                        className="h-40 w-full object-cover"
                                    />
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-2 right-2 rounded-full bg-white p-2 shadow-md transition-transform hover:scale-110"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 text-gray-700"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}

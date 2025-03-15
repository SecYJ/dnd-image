// app/components/ImageUploadForm.tsx
"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import { UploadIcon, UserIcon, XIcon } from "lucide-react";
import { z } from "zod";

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

    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.username || formData.images.length === 0) {
            alert("Please fill all fields");
            return;
        }

        const submitData = new FormData();
        submitData.append("username", formData.username);
        formData.images.forEach((image) => submitData.append("images", image));

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: submitData,
            });
            if (response.ok) {
                alert("Upload successful!");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed!");
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
                    <div className="mb-4 text-sm text-red-500">
                        {errors.map((error, index) => (
                            <p key={index}>{error}</p>
                        ))}
                    </div>
                )}

                {/* Status Message */}
                <p className="mb-4 text-sm text-gray-600">
                    {formData.images.length}/{MAX_IMAGES} images selected
                </p>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-400"
                    disabled={formData.images.length === 0}
                >
                    Submit
                </button>
            </form>
        </div>
    );
}

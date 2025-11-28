import { queryApi } from "@/lib/api";
import imageCompression from "browser-image-compression";

export type SaveImageResponseType = {
  secure_url?: string;
  public_id?: string;
};

type UploadImageInput = {
  file: File;
  type: "board" | "card";
  id: string;
};

export function useUploadConfig() {
  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  };
}

export function useUploadImage() {
  const { cloudName, uploadPreset } = useUploadConfig();

  const mutation = queryApi.useMutation("post", "/media/image/{type}/{id}");

  const uploadImage = async ({ file, type, id }: UploadImageInput) => {
    if (!cloudName || !uploadPreset)
      throw new Error("Cloudinary config not loaded");

    let fileToUpload = file;
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });
      fileToUpload = compressedFile;
    } catch (e) {
      console.warn("Image compression failed, upload original file", e);
    }

    const folder = `schedule_management/${type}`;
    const form = new FormData();
    form.append("upload_preset", uploadPreset);
    form.append("folder", folder);
    form.append("file", fileToUpload);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: form,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const uploadData = await uploadRes.json();
    if (!uploadData.secure_url || !uploadData.public_id)
      throw new Error("Invalid Cloudinary response");

    const savedData = await mutation.mutateAsync({
      params: { path: { type, id } },
      body: {
        secure_url: uploadData.secure_url,
        public_id: uploadData.public_id,
      },
    });

    return savedData;
  };

  return { uploadImage };
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getSafeFileName = (url: string) => {
  const clean = url.split("?")[0];
  const name = clean.split("/").pop();
  return name && name.includes(".") ? name : "image.jpg";
};

export const imageUrlToFile = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch image from URL");
  }

  const blob = await res.blob();

  const filename = getSafeFileName(url);
  const fileType = blob.type || "image/jpeg";

  return new File([blob], filename, { type: fileType });
};

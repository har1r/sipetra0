// src/utils/uploadImage.js
import { API_PATHS } from "./apiPaths";
import axiosInstance from "./axiosInstance";

// Bisa diekspor untuk dipakai ulang di ImagePreview agar konsisten
export const DEFAULT_MAX_IMAGE_MB = 3;
export const DEFAULT_ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

/**
 * Upload gambar ke server.
 * @param {File} imageFile - File gambar dari input.
 * @param {Object} [opts]
 * @param {number} [opts.maxMB=DEFAULT_MAX_IMAGE_MB] - Batas ukuran file (MB).
 * @param {string[]} [opts.allowedTypes=DEFAULT_ALLOWED_IMAGE_TYPES] - Tipe MIME yang diizinkan.
 * @param {(percent:number)=>void} [opts.onProgress] - Callback progress upload (0-100).
 * @param {AbortSignal} [opts.signal] - AbortController signal untuk membatalkan upload.
 * @returns {Promise<{ imageUrl: string, [key:string]: any }>}
 */
const uploadImage = async (
  imageFile,
  {
    maxMB = DEFAULT_MAX_IMAGE_MB,
    allowedTypes = DEFAULT_ALLOWED_IMAGE_TYPES,
    onProgress,
    signal,
  } = {}
) => {
  if (!imageFile) throw new Error("Tidak ada file yang dipilih.");
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error("Hanya gambar JPG/JPEG/PNG yang diperbolehkan.");
  }
  if (imageFile.size > maxMB * 1024 * 1024) {
    throw new Error(`Ukuran gambar maksimal ${maxMB}MB.`);
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const res = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, formData, {
      // Biarkan axios set Content-Type + boundary otomatis
      onUploadProgress: (evt) => {
        if (!onProgress || !evt.total) return;
        const percent = Math.round((evt.loaded * 100) / evt.total);
        onProgress(percent);
      },
      signal,
      timeout: 60_000, // opsional: timeout 60s
    });

    // Normalisasi hasil
    const data = res?.data || {};
    if (!data.imageUrl) {
      throw new Error("Respons tidak berisi imageUrl.");
    }
    return data;
  } catch (err) {
    // Normalisasi pesan error
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Terjadi kesalahan saat mengunggah gambar.";
    throw new Error(msg);
  }
};

export default uploadImage;

// import { API_PATHS } from "./apiPaths";
// import axiosInstance from "./axiosInstance";

// const MAX_FILE_SIZE_MB = 2;
// const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// const uploadImage = async (imageFile) => {
//   if (!imageFile) throw new Error("No file selected.");
//   if (imageFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
//     throw new Error("Ukuran gambar maksimal 2MB.");
//   }
//   if (!ALLOWED_TYPES.includes(imageFile.type)) {
//     throw new Error("Hanya gambar JPG, JPEG, dan PNG yang diperbolehkan.");
//   }

//   const formData = new FormData();
//   formData.append("image", imageFile);

//   try {
//     const response = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//     return response.data; // { imageUrl: "..." }
//   } catch (error) {
//     console.error("Gagal mengunggah gambar:", error);
//     throw new Error(
//       error.response?.data?.message || error.message || "Terjadi kesalahan saat mengunggah gambar."
//     );
//   }
// };

// export default uploadImage;
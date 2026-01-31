// src/utils/image.ts
export function validateImageFile(file: File, maxMB = 5) {
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드 가능합니다.");
    }
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`이미지는 ${maxMB}MB 이하만 업로드 가능합니다.`);
    }
  }
  
  export async function resizeToWebp(
    file: File,
    opts?: { maxWidth?: number; quality?: number }
  ): Promise<File> {
    const maxWidth = opts?.maxWidth ?? 1280;
    const quality = opts?.quality ?? 0.82;
  
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
  
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      });
  
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
  
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas를 생성하지 못했습니다.");
  
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error("이미지 변환에 실패했습니다.")),
          "image/webp",
          quality
        );
      });
  
      const newName = file.name.replace(/\.\w+$/, "") + ".webp";
      return new File([blob], newName, { type: "image/webp" });
    } finally {
      // Object URL 정리
      URL.revokeObjectURL(img.src);
    }
  }
  
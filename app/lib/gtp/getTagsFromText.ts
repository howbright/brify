// app/lib/utils/getTagsFromText.ts

export async function getTagsFromText(text: string): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // ✅ 실제론 GPT 호출할 수 있도록 설계
        resolve(["공부법", "루틴", "성장 마인드셋", "동기부여"]);
      }, 500); // mock delay
    });
  }
  
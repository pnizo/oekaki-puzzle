export function isTitleValid(title: string, ngWords: string[] = []): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "タイトルを入力してね" };
  }
  if (title.length > 20) {
    return { valid: false, error: "タイトルが長すぎます" };
  }

  const lowerTitle = title.toLowerCase();
  // Combine default hardcoded list (fallback) with dynamic list
  const defaultNgWords = ["ng", "bad", "offensive", "kill", "die"];
  const allNgWords = [...new Set([...defaultNgWords, ...ngWords])];

  const hasNgWord = allNgWords.some((word) => lowerTitle.includes(word.toLowerCase()));

  if (hasNgWord) {
    return { valid: false, error: "禁止ワードが含まれています" };
  }

  return { valid: true };
}

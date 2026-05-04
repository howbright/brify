const TAG_LIMIT = 12;
const TAG_SPLIT_REGEX = /[,，;|\n\r\t]+/g;

function cleanTag(raw: string) {
  const withoutHashes = raw.replace(/^#+/, "").trim();
  return withoutHashes;
}

export function normalizeTags(tags: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const cleaned = cleanTag(raw);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
    if (result.length >= TAG_LIMIT) break;
  }

  return result;
}

export function parseTagsFromInput(input: string) {
  return input
    .split(TAG_SPLIT_REGEX)
    .map(cleanTag)
    .filter(Boolean);
}

export function appendParsedTags(current: string[], input: string) {
  const parsed = parseTagsFromInput(input);
  if (parsed.length === 0) return current;
  return normalizeTags([...current, ...parsed]);
}

export function shouldCommitTagKey(key: string) {
  return key === "Enter" || key === "," || key === "Tab";
}

const MAX_FILENAME_LENGTH = 100;

function toKebabCase(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function truncateAtHyphen(kebab: string, maxLength: number): string {
  if (kebab.length <= maxLength) {
    return kebab;
  }

  const truncated = kebab.slice(0, maxLength);
  const lastHyphen = truncated.lastIndexOf('-');
  if (lastHyphen > 0) {
    return truncated.slice(0, lastHyphen);
  }
  return truncated.replace(/-+$/, '');
}

export function generateFileName(title: string, type: 'entity' | 'concept' | 'source'): string {
  const kebab = toKebabCase(title);

  if (type === 'source') {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateSuffix = `${yyyy}-${mm}-${dd}`;

    const maxKebabLength = MAX_FILENAME_LENGTH - 18;
    const truncatedKebab = truncateAtHyphen(kebab, maxKebabLength);

    return `source-${truncatedKebab}-${dateSuffix}.md`;
  }

  const truncatedKebab = truncateAtHyphen(kebab, MAX_FILENAME_LENGTH);
  return `${truncatedKebab}.md`;
}

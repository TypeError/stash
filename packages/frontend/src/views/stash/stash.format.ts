function padDatePart(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatStashedAt(value: string): string {
  if (value.length === 0) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  const seconds = padDatePart(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatPath(path: string | undefined): string {
  return path !== undefined && path.length > 0 ? path : "/";
}

export function formatPathWithQuery(path: string | undefined, url: string | undefined): string {
  const formattedPath = formatPath(path);

  if (url === undefined || url.length === 0 || formattedPath.includes("?")) {
    return formattedPath;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.search.length > 0 ? `${formattedPath}${parsedUrl.search}` : formattedPath;
  } catch {
    return formattedPath;
  }
}

export function formatHeaderValues(values: string[]): string {
  return values.join(", ");
}

export function formatStashedAt(value: string): string {
  if (value.length === 0) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export function formatPath(path: string | undefined): string {
  return path !== undefined && path.length > 0 ? path : "/";
}

export function formatHeaderValues(values: string[]): string {
  return values.join(", ");
}

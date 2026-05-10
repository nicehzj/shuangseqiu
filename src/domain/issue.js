export function issueFromDate(dateValue) {
  return String(dateValue ?? '').replaceAll('-', '');
}

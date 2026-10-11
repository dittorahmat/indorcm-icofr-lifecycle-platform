export { extractBaseId, makeGlSpecificId } from '@shared/control-linkage';

export function parseSequenceNumber(id: string, prefix: string): number {
  const remainder = id.substring(prefix.length);
  const match = remainder.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

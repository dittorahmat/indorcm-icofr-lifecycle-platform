export function extractBaseId(id: string): string {
  if (!id) return id;
  
  const legacyMatch = id.match(/^([RC]-\d+)(?:-(.+))?$/i);
  if (legacyMatch) {
    return legacyMatch[1];
  }

  const parts = id.split('-');
  if (parts.length > 1) {
    let seqIndex = -1;
    for (let i = 1; i < parts.length; i++) {
      if (/^\d{3,}$/.test(parts[i])) { // Require at least 3 digits to be confident it's a seq
        seqIndex = i;
        break;
      }
    }
    
    if (seqIndex !== -1) {
      if (seqIndex < parts.length - 1) {
        return parts.slice(0, seqIndex + 1).join('-');
      }
      return id;
    }

    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart) || lastPart.length >= 4) {
      return parts.slice(0, -1).join('-');
    }
  }
  return id;
}

export function makeGlSpecificId(baseId: string, glCode: string): string {
  if (!glCode) return baseId;
  const base = extractBaseId(baseId);
  return `${base}-${glCode}`;
}

export function parseSequenceNumber(id: string, prefix: string): number {
  const remainder = id.substring(prefix.length);
  const match = remainder.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

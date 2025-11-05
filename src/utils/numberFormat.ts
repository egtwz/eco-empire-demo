function formatIntWithDots(intStr: string): string {
  const neg = intStr.startsWith('-');
  const s = neg ? intStr.slice(1) : intStr;
  const withDots = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return neg ? `-${withDots}` : withDots;
}

function formatNumberCustom(num: number, decimalsHint: number): string {
  // use decimalsHint as maximum decimals, then trim trailing zeros
  const fixed = num.toFixed(decimalsHint);
  let [i, f] = fixed.split('.');
  // trim trailing zeros in fractional part
  if (f) {
    f = f.replace(/0+$/g, '');
  }
  const iDots = formatIntWithDots(i);
  if (!f || f.length === 0) return iDots;
  return `${iDots},${f}`; // comma as decimal separator
}

export function formatWithMUnits(value: number): string {
  const abs = Math.abs(value);
  // Below 1m: integer part with dot thousands
  if (abs < 1_000_000) {
    return formatIntWithDots(String(Math.trunc(value)));
  }

  // Determine how many groups of 1e6 (m) fit into the number
  const base = 1_000_000;
  let unitPower = 1; // m^1 for millions
  let divisor = base; // 1e6
  while (abs / divisor >= base) {
    divisor *= base; // 1e12, 1e18, ...
    unitPower += 1;  // mm, mmm, ...
  }

  const short = value / divisor;
  const units = 'm'.repeat(unitPower);

  // Decimals hint selection
  const a = Math.abs(short);
  const decimalsHint = a >= 100 ? 0 : a >= 10 ? 1 : 2;
  const formatted = formatNumberCustom(short, decimalsHint);
  return `${formatted}${units}`;
}



/**
 * cn() — tiny class-name composer. clsx-like behavior, zero deps.
 *
 * Accepts strings, numbers, falsy values, arrays, and plain objects:
 *   cn('a', cond && 'b', { 'c': isC, 'd': !isD }, ['e', 'f'])
 */
const flatten = (out, value) => {
  if (!value && value !== 0) return out;
  if (typeof value === 'string' || typeof value === 'number') {
    out.push(String(value));
    return out;
  }
  if (Array.isArray(value)) {
    for (const v of value) flatten(out, v);
    return out;
  }
  if (typeof value === 'object') {
    for (const key in value) {
      if (value[key]) out.push(key);
    }
    return out;
  }
  return out;
};

export const cn = (...args) => {
  const out = [];
  for (const arg of args) flatten(out, arg);
  return out.join(' ');
};

export default cn;

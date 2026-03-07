/**
 * AmountDisplay – muestra montos con formato COP
 * Props:
 *   value:   number | string
 *   size?:   'sm' | 'md' | 'lg'
 *   color?:  bool (verde si positivo)
 */

import { fmt } from "../utils/formatters";


const SIZE_MAP = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base font-semibold',
};

const AmountDisplay = ({ value, size = 'md', color = false }) => (
  <span className={`font-mono tabular-nums ${SIZE_MAP[size]} ${color ? 'text-emerald-700' : 'text-gray-800'}`}>
    {fmt(value)}
  </span>
);

export default AmountDisplay;
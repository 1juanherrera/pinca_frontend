/**
 * AmountDisplay – muestra montos con formato COP
 * Props:
 *   value:   number | string
 *   size?:   'sm' | 'md' | 'lg'
 *   color?:  bool (verde si positivo)
 */

import { fmt } from "../utils/formatters";

const AmountDisplay = ({ value, color = false }) => (
  <span className={`py-1 text-right font-medium text-xs tabular-nums ${color ? 'text-emerald-700' : 'text-zinc-800'}`}>
    {fmt(value)}
  </span>
);

export default AmountDisplay;
/**
 * AmountDisplay – muestra montos con formato COP
 * Props:
 *   value:   number | string
 *   size?:   'sm' | 'md' | 'lg'
 *   color?:  bool (verde si positivo)
 */

import { fmt } from "../utils/formatters";

const AmountDisplay = ({ value, color = false }) => (
  <span className={`py-1 text-right font-medium text-xs tabular-nums ${color ? 'text-semantic-success-fg' : 'text-content-primary'}`}>
    {fmt(value)}
  </span>
);

export default AmountDisplay;
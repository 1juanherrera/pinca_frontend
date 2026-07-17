import { useState } from 'react';
import { useConfigValue } from '../modules/Configuracion/api/useConfiguracion';

/**
 * Cantidad de filas por página para tablas server-side.
 *
 * Default = `page_size_default` de Configuración → Paginación (REACTIVO: si se
 * cambia en Settings, todas las tablas que usan este hook se actualizan solas).
 * El usuario puede sobreescribirlo por tabla con el selector de filas; pasar
 * `null` vuelve al default del config.
 *
 * API compatible con useState → drop-in replacement de `useState(20)`:
 *   const [limit, setLimit] = usePageSize();
 *
 * ⚠️ Por qué NO `useState(useConfigValue(...))`: `useState(valorInicial)` captura
 * el valor UNA sola vez al montar; no reacciona a que el config cargue después
 * ni a cambios posteriores. Este hook deriva `limit` en cada render (reactivo).
 */
export default function usePageSize(fallback = 20) {
  const cfg = useConfigValue('page_size_default', fallback);
  const [override, setOverride] = useState(null);
  const limit = override ?? Number(cfg) ?? fallback;
  return [limit, setOverride];
}

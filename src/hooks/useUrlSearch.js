/**
 * useUrlSearch — lee un query param de la URL al montar y lo limpia
 * después (sin reload). Pensado para que páginas destino del Cmd+K
 * arranquen con el filtro precargado.
 *
 * Uso:
 *   const initialQ = useUrlSearch('q');
 *   useEffect(() => { if (initialQ) setSearch(initialQ); }, [initialQ]);
 */
import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

export const useUrlSearch = (paramName = 'q', { clean = true } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const consumedRef = useRef(false);

  const initial = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get(paramName) ?? '';
  }, [location.search, paramName]);

  useEffect(() => {
    if (!clean || consumedRef.current || !initial) return;
    consumedRef.current = true;
    // Limpiar el param de la URL para que el back/refresh no re-aplique
    const params = new URLSearchParams(location.search);
    params.delete(paramName);
    const newSearch = params.toString();
    navigate(
      { pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' },
      { replace: true },
    );
  }, [clean, initial, paramName, location.pathname, location.search, navigate]);

  return initial;
};

export default useUrlSearch;

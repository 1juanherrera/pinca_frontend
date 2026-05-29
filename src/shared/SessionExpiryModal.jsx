import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBoundStore } from '../store/useBoundStore';
import apiClient from '../api/apiClient';
import { API_ROUTES } from '../api/apiRoutes';
import { Button } from './Button';

const REFRESH_KEY = 'pinca:refresh_token';

// Mostramos el aviso 5 minutos antes de que expire el JWT.
const WARN_BEFORE_MS = 5 * 60 * 1000;

/**
 * Decodifica el payload del JWT sin librería. Devuelve `exp` en milisegundos
 * (el JWT lo trae en segundos) o `null` si no se puede parsear.
 */
const getJwtExpMs = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload?.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

/**
 * Modal "tu sesión expira pronto".
 *
 * Lo monta `Layout` a nivel raíz (junto a ForceChangePasswordModal). Programa
 * un timer que muestra el aviso 5 minutos antes del `exp` del JWT actual.
 * Si el token no tiene `exp` parseable, simplemente no se programa nada (no rompe).
 */
const SessionExpiryModal = () => {
  const token   = useBoundStore((s) => s.token);
  const user    = useBoundStore((s) => s.user);
  const setAuth = useBoundStore((s) => s.setAuth);
  const logout  = useBoundStore((s) => s.logout);
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [extending, setExtending] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  const warnTimerRef = useRef(null);
  const expTimerRef  = useRef(null);
  const tickRef      = useRef(null);

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) { clearTimeout(warnTimerRef.current); warnTimerRef.current = null; }
    if (expTimerRef.current)  { clearTimeout(expTimerRef.current);  expTimerRef.current = null; }
    if (tickRef.current)      { clearInterval(tickRef.current);     tickRef.current = null; }
  }, []);

  const doLogout = useCallback(() => {
    clearTimers();
    setVisible(false);
    logout();
    navigate('/login', { replace: true });
  }, [clearTimers, logout, navigate]);

  // Programa los timers según el `exp` del token actual.
  const schedule = useCallback((jwt) => {
    clearTimers();
    setVisible(false);

    const expMs = getJwtExpMs(jwt);
    if (!expMs) return; // Sin exp parseable → no programar (no rompe).

    const now = Date.now();
    const msToExp  = expMs - now;
    const msToWarn = msToExp - WARN_BEFORE_MS;

    // Token ya expirado → cerrar sesión.
    if (msToExp <= 0) {
      doLogout();
      return;
    }

    // Si ya estamos dentro de la ventana de aviso, mostrar de inmediato.
    if (msToWarn <= 0) {
      setVisible(true);
    } else {
      warnTimerRef.current = setTimeout(() => setVisible(true), msToWarn);
    }

    // Al llegar al exp sin extender, cerrar sesión.
    expTimerRef.current = setTimeout(() => doLogout(), msToExp);
  }, [clearTimers, doLogout]);

  // (Re)programar cada vez que cambia el token.
  useEffect(() => {
    if (!token || !user) {
      clearTimers();
      setVisible(false);
      return;
    }
    schedule(token);
    return clearTimers;
  }, [token, user, schedule, clearTimers]);

  // Countdown visible: refresca el tiempo restante cada segundo mientras el modal está abierto.
  useEffect(() => {
    if (!visible) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    const expMs = getJwtExpMs(token);
    const update = () => setRemainingMs(expMs ? Math.max(0, expMs - Date.now()) : 0);
    update();
    tickRef.current = setInterval(update, 1000);
    return () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } };
  }, [visible, token]);

  const extender = async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      // Sin refresh token guardado no podemos extender — cerrar sesión.
      doLogout();
      return;
    }
    setExtending(true);
    try {
      const res = await apiClient.post(API_ROUTES.AUTH.REFRESH, { refresh_token: refreshToken });
      if (res?.ok && res?.token) {
        if (res.refresh_token) {
          localStorage.setItem(REFRESH_KEY, res.refresh_token);
        }
        // setAuth para el token nuevo (mantiene el user actual).
        setAuth(res.token, user);
        setVisible(false);
        schedule(res.token); // Reprograma el timer con el nuevo exp.
        toast.success('Sesión extendida.');
      } else {
        doLogout();
      }
    } catch {
      // 401 / inválido / expirado → cerrar sesión.
      doLogout();
    } finally {
      setExtending(false);
    }
  };

  if (!visible) return null;

  // Formato mm:ss del tiempo restante.
  const totalSec = Math.floor(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tiempo = `${min}:${String(sec).padStart(2, '0')}`;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-surface-overlay backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-base rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Hero */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-semantic-warning-subtle flex items-center justify-center shrink-0">
            <Clock size={20} className="text-semantic-warning-fg" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-content-primary leading-tight">
              Tu sesión está por expirar
            </h2>
            <p className="text-sm text-content-tertiary mt-1">
              Por seguridad, tu sesión se cerrará automáticamente en{' '}
              <span className="font-semibold text-content-primary tabular-nums">{tiempo}</span>.
              ¿Querés extenderla?
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            icon={RefreshCw}
            loading={extending}
            disabled={extending}
            onClick={extender}
            className="flex-1"
          >
            Extender sesión
          </Button>
          <Button
            type="button"
            variant="ghost"
            icon={LogOut}
            onClick={doLogout}
            disabled={extending}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionExpiryModal;

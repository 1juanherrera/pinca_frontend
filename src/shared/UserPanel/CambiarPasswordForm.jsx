import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { useBoundStore } from '../../store/useBoundStore';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { API_ROUTES } from '../../api/apiRoutes';
import toast from 'react-hot-toast';
import { SectionTitle } from './atoms';

// ─── Cambiar contraseña (vive dentro del tab Seguridad) ───────────────────────
const CambiarPasswordForm = () => {
  const user    = useBoundStore(s => s.user);
  const setAuth = useBoundStore(s => s.setAuth);
  const [show, setShow] = useState({ curr: false, next: false, conf: false });
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [ok,   setOk]   = useState(false);

  const { mutate: cambiarPwd, isPending } = useMutation({
    mutationFn: (body) => apiClient.patch(API_ROUTES.AUTH.CAMBIAR_PASSWORD, body),
    onSuccess: (res) => {
      // El backend bumpea token_version al cambiar password — usar el token
      // nuevo para que esta sesión no caiga al próximo request.
      const nuevoToken = res?.token;
      if (nuevoToken && user) setAuth(nuevoToken, user);
      toast.success('Contraseña actualizada');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    },
    onError: (e) => toast.error(e?.response?.data?.msg || 'Contraseña actual incorrecta'),
  });

  const handlePwd = (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return toast.error('Mínimo 8 caracteres.');
    if (form.newPassword !== form.confirmPassword) return toast.error('Las contraseñas no coinciden.');
    cambiarPwd({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div>
      <SectionTitle icon={KeyRound}>Cambiar contraseña</SectionTitle>
      <form onSubmit={handlePwd} className="flex flex-col gap-2.5">
        {[
          { key: 'currentPassword', label: 'Contraseña actual',          sk: 'curr' },
          { key: 'newPassword',     label: 'Nueva contraseña',            sk: 'next' },
          { key: 'confirmPassword', label: 'Confirmar nueva contraseña',  sk: 'conf' },
        ].map(({ key, label, sk }) => (
          <div key={key} className="relative">
            <label className="block text-xs text-content-tertiary mb-1">{label}</label>
            <div className="relative">
              <input type={show[sk] ? 'text' : 'password'} value={form[key]} required autoComplete={sk === 'curr' ? 'current-password' : 'new-password'}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-border-base rounded-lg px-3 py-2 pr-9 text-sm bg-surface-subtle text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:bg-surface-base transition-all" />
              <button type="button" onClick={() => setShow(s => ({ ...s, [sk]: !s[sk] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary">
                {show[sk] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        <button type="submit" disabled={isPending}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all mt-1 ${
            ok ? 'bg-semantic-success text-content-inverse' : 'bg-content-primary hover:bg-content-secondary text-content-inverse disabled:opacity-60'
          }`}>
          {isPending ? 'Guardando…' : ok ? '¡Actualizada correctamente!' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
};

export default CambiarPasswordForm;

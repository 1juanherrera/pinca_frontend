import { useState, useCallback } from 'react';

/**
 * Validación de formulario por campo, con estado `touched`.
 *
 * Pensado para forms que no usan react-hook-form. Patrón:
 *
 *   const v = useFormValidation({
 *     cliente_id:    { required: 'Selecciona un cliente' },
 *     fecha_emision: {
 *       required: 'La fecha es obligatoria',
 *       validate: (val) => /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Formato inválido',
 *     },
 *   });
 *
 *   // En cada input/select:
 *   <FormInput
 *     value={form.cliente_id}
 *     onChange={(e) => { setField('cliente_id', e.target.value); v.change('cliente_id', e.target.value); }}
 *     onBlur={() => v.blur('cliente_id', form.cliente_id)}
 *     error={v.fieldError('cliente_id')}
 *   />
 *
 *   // Antes del submit:
 *   if (!v.validateAll(form)) return;
 *
 * `fieldError(name)` devuelve el mensaje solo si el campo ya fue touched
 * o si se llamó `validateAll`. Así no aparecen errores rojos al renderizar
 * un form vacío por primera vez.
 *
 * Reglas soportadas:
 *   - required: string  — mensaje si el valor es vacío (null, '', undefined)
 *   - validate: (val) => true | string  — true = ok, string = mensaje de error
 */
export function useFormValidation(rules) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    const rule = rules[name];
    if (!rule) return null;

    const isEmpty = value === null || value === undefined || value === '' ||
      (typeof value === 'string' && value.trim() === '');

    if (rule.required && isEmpty) return rule.required;
    if (!isEmpty && typeof rule.validate === 'function') {
      const result = rule.validate(value);
      if (result !== true && typeof result === 'string') return result;
    }
    return null;
  }, [rules]);

  // Llamar en onBlur — marca el campo como visitado y valida.
  const blur = useCallback((name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  }, [validateField]);

  // Llamar en onChange — si el campo ya estaba touched, revalida.
  // No marca touched para no mostrar errores mientras el usuario escribe la primera vez.
  const change = useCallback((name, value) => {
    setTouched((prev) => {
      if (!prev[name]) return prev;
      const err = validateField(name, value);
      setErrors((p) => ({ ...p, [name]: err }));
      return prev;
    });
  }, [validateField]);

  // Validación total — marca todos los campos como touched, valida y devuelve OK.
  const validateAll = useCallback((formValues) => {
    const next = {};
    const touchedAll = {};
    let ok = true;
    for (const name of Object.keys(rules)) {
      touchedAll[name] = true;
      const err = validateField(name, formValues[name]);
      next[name] = err;
      if (err) ok = false;
    }
    setErrors(next);
    setTouched(touchedAll);
    return ok;
  }, [rules, validateField]);

  // Devuelve el error solo si el campo fue touched. Útil para JSX directo.
  const fieldError = useCallback(
    (name) => (touched[name] ? errors[name] : null),
    [errors, touched]
  );

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return { errors, touched, blur, change, validateAll, fieldError, reset };
}

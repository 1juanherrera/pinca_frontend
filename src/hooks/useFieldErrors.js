import { useState, useCallback } from 'react';

/**
 * Mini-store de errores de formulario por campo.
 *
 * Uso típico al recibir un 422 de validación del backend:
 *
 *   const { errors, setFromBackend, clearField, clearAll } = useFieldErrors();
 *   try {
 *     await createAsync(payload);
 *   } catch (err) {
 *     setFromBackend(err);
 *   }
 *
 *   <FormInput error={errors.email} onChange={(e) => { clearField('email'); ... }} />
 *
 * El backend devuelve via ValidatesJson:
 *   { success: false, message: 'Datos inválidos', errors: { campo: 'msg' } }
 *
 * Para reglas anidadas tipo 'items.*.cantidad', CI4 devuelve la key como
 * 'items.0.cantidad', 'items.1.cantidad', etc. — el consumidor decide cómo
 * presentarlas.
 */
export function useFieldErrors() {
  const [errors, setErrors] = useState({});

  const setFromBackend = useCallback((err) => {
    const backendErrors = err?.response?.data?.errors;
    if (backendErrors && typeof backendErrors === 'object') {
      setErrors(backendErrors);
    }
  }, []);

  const clearField = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  return { errors, setErrors, setFromBackend, clearField, clearAll };
}

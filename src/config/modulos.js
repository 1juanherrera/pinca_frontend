// Lista canónica de módulos del sistema. El campo `key` debe coincidir
// exactamente con los valores en la tabla `permisos_rol_modulo` del backend.
export const MODULOS_SISTEMA = [
  { key: 'panel-principal',  label: 'Panel Principal',    grupo: 'Sistema' },
  { key: 'sedes',            label: 'Sedes y Bodegas',    grupo: 'Inventario' },
  { key: 'catalogo',         label: 'Catálogo',           grupo: 'Inventario' },
  { key: 'inventario-global',label: 'Inventario',         grupo: 'Inventario' },
  { key: 'formulaciones',    label: 'Formulaciones',      grupo: 'Producción' },
  { key: 'produccion',       label: 'Producción',         grupo: 'Producción' },
  { key: 'rentabilidad',     label: 'Rentabilidad',       grupo: 'Análisis' },
  { key: 'comercial',        label: 'Comercial',          grupo: 'Ventas' },
  { key: 'compras',          label: 'Compras',            grupo: 'Compras' },
  { key: 'cartera',          label: 'Cartera',            grupo: 'Finanzas' },
  { key: 'clientes',         label: 'Clientes',           grupo: 'Relaciones' },
  { key: 'proveedores',      label: 'Proveedores',        grupo: 'Relaciones' },
  { key: 'movimientos',      label: 'Movimientos',        grupo: 'Inventario' },
  { key: 'pagos',            label: 'Pagos',              grupo: 'Finanzas' },
  { key: 'tambores',         label: 'Tambores',           grupo: 'Inventario' },
  { key: 'prorrateo',        label: 'Prorrateo',          grupo: 'Análisis' },
  { key: 'roles',            label: 'Gestión de Roles',   grupo: 'Sistema' },
  { key: 'sincronizacion',   label: 'Sincronización',     grupo: 'Inventario' },
  { key: 'trazabilidad',     label: 'Trazabilidad',       grupo: 'Inventario' },
  { key: 'costos',           label: 'Costos',             grupo: 'Análisis' },
];

export const ROLES_LABELS = {
  admin:    'Administrador',
  operador: 'Operador',
  visor:    'Visor',
};

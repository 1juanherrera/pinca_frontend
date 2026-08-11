// ── Constantes ────────────────────────────────────────────────────────────────

export const EMPRESA = {
  nombre:    'PINTURAS INDUSTRIALES DEL CARIBE S.A.S',
  nit:       'NIT 901.314.182-9',
  direccion: 'Calle 99 # 6-59',
  telefono:  'Tel: 3145973532',
  ciudad:    'Barranquilla - Colombia',
  email:     'pinca.sas@hotmail.com',
  celular:   '+57 3019794729',
  web:       'www.pinca.com.co',
};

export const TIPO_TABS = [
  { label: 'Todos',           tipo: null },
  { label: 'Materias Primas', tipo: 1    },
  { label: 'Productos',       tipo: 0    },
  { label: 'Insumos',         tipo: 2    },
];

export const TIPO_TONE  = { 0: 'info', 1: 'warning', 2: 'neutral' };
export const TIPO_LABEL = { 0: 'Producto', 1: 'Materia Prima', 2: 'Insumo' };

export const fmtNum = (n, dec = 2) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(n ?? 0);

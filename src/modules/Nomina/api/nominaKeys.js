export const nominaKeys = {
  all: ['nomina'],
  empleados: () => [...nominaKeys.all, 'empleados'],
  periodos: () => [...nominaKeys.all, 'periodos'],
  periodo: (id) => [...nominaKeys.all, 'periodo', id?.toString()],
  descuentos: (empleadoId) => [...nominaKeys.all, 'descuentos', empleadoId?.toString() ?? 'todos'],
};

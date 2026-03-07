export const clienteKeys = {
  all: ['clientes'],
  lists: () => [...clienteKeys.all, 'list'],
  details: () => [...clienteKeys.all, 'detail'],
  detail: (id) => [...clienteKeys.details(), id?.toString()],
};
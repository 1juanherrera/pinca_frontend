import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { formulacionKeys } from '../api/FormulacionKeys';
import FormulacionVersionesDrawer from './FormulacionVersionesDrawer';

/**
 * Wrapper que resuelve el id_formulaciones a partir del item_general_id.
 * El usuario clickea "Historial" desde la vista de Formulaciones (que conoce
 * el item_general_id seleccionado), pero el drawer trabaja con id_formulaciones.
 */
const VersionesByItemWrapper = ({ itemGeneralId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: formulacionKeys.byItem(String(itemGeneralId)),
    queryFn:  () => apiClient.get(`/formulacion_item/${itemGeneralId}`),
    enabled:  !!itemGeneralId,
  });

  if (isLoading) {
    return (
      <FormulacionVersionesDrawer
        formulacionId={null}
        formulacionNombre="Resolviendo formulación…"
        isLoadingExterno
        onClose={onClose}
      />
    );
  }

  const formulacion = data?.data ?? data;
  const formulacionId   = formulacion?.formulacion_id ?? formulacion?.id_formulaciones;
  const formulacionName = formulacion?.nombre;

  if (!formulacionId) {
    return (
      <FormulacionVersionesDrawer
        formulacionId={null}
        formulacionNombre="Sin formulación"
        onClose={onClose}
      />
    );
  }

  return (
    <FormulacionVersionesDrawer
      formulacionId={formulacionId}
      formulacionNombre={formulacionName}
      onClose={onClose}
    />
  );
};

export default VersionesByItemWrapper;

import { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button, ButtonSquare } from '../../shared/Button';
import { useBoundStore } from '../../store/useBoundStore';
import { useCatalogoList, useCatalogoMutations } from './api/useCatalogo';
import CatalogoTable from './components/CatalogoTable';
import ItemDetailModal from './components/ItemDetailModal';
import CatalogoForm from './components/CatalogoForm';

const CatalogoPage = () => {
  const { setActiveTitle } = useBoundStore();
  const { items, isLoading, refetch } = useCatalogoList();
  const { crear, actualizar, isCreating, isUpdating } = useCatalogoMutations();

  const [selectedId, setSelectedId] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [formItem, setFormItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setActiveTitle('Catálogo'); }, [setActiveTitle]);

  const handleSelect = (item) => {
    setSelectedId(item.id_item_general);
    setSelectedPreview(item);
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setSelectedPreview(null);
  };

  const handleOpenCreate = () => {
    setFormItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    handleCloseDetail();
    setFormItem(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormItem(null);
  };

  const handleSubmitForm = async (data) => {
    if (formItem?.id_item_general) {
      await actualizar.mutateAsync({ id: formItem.id_item_general, data });
    } else {
      await crear.mutateAsync(data);
    }
    handleCloseForm();
  };

  return (
    <div className="flex flex-col w-full gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Catálogo de Ítems"
          icon={BookOpen}
          breadcrumbs={[
            { label: 'Administración' },
            { label: 'Catálogo', path: '/catalogo' },
          ]}
        />

        <div className="flex items-center gap-2">
          <ButtonSquare
            icon={RefreshCw}
            sizeIcon={18}
            title="Actualizar"
            variant="white"
            onClick={refetch}
          />
          <Button variant="black" onClick={handleOpenCreate} icon={Plus}>
            Nuevo Ítem
          </Button>
        </div>
      </div>

      <CatalogoTable
        items={items}
        isLoading={isLoading}
        onSelect={handleSelect}
      />

      {selectedId && (
        <ItemDetailModal
          itemId={selectedId}
          itemPreview={selectedPreview}
          onClose={handleCloseDetail}
          onEdit={handleEdit}
        />
      )}

      {showForm && (
        <CatalogoForm
          item={formItem}
          onSubmit={handleSubmitForm}
          onClose={handleCloseForm}
          isSaving={isCreating || isUpdating}
        />
      )}
    </div>
  );
};

export default CatalogoPage;

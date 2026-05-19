import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { BookOpen, Plus, RefreshCw, Boxes, Truck } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import PageTabs from '../../shared/PageTabs';
import { Button, ButtonSquare } from '../../shared/Button';
import TopProgressBar from '../../shared/TopProgressBar';
import ConfirmModal from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import { useUrlSearch } from '../../hooks/useUrlSearch';
import { useCatalogoList, useCatalogoMutations } from './api/useCatalogo';
import CatalogoTable from './components/CatalogoTable';
import ItemDetailModal from './components/ItemDetailModal';
import CatalogoForm from './components/CatalogoForm';
import InventarioGlobalPage from '../InventarioGlobal/InventarioGlobalPage';
import CatalogoTab from '../Proveedores/components/CatalogoTab';
import ItemProveedorForm from '../Proveedores/components/ItemProveedorForm';

const TABS = [
  { key: 'productos',   label: 'Productos',   icon: BookOpen },
  { key: 'stock',       label: 'Stock',        icon: Boxes },
  { key: 'proveedores', label: 'Proveedores',  icon: Truck },
];

const CatalogoPage = () => {
  const { setActiveTitle, openDrawer } = useBoundStore();
  const { items, isLoading, refetch } = useCatalogoList();
  const { crear, actualizar, isCreating, isUpdating } = useCatalogoMutations();
  const initialQ = useUrlSearch('q');
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState(() => searchParams.get('tab') || 'productos');
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
    <div className="relative flex flex-col w-full gap-4">
      <TopProgressBar active={isLoading && tab === 'productos'} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Catálogo"
          subtitle="Productos, stock y proveedores"
          icon={BookOpen}
          breadcrumbs={[
            { label: 'Inventario' },
            { label: 'Catálogo', path: '/catalogo' },
          ]}
        />

        <div className="flex items-center gap-2">
          {tab === 'productos' && (
            <>
              <ButtonSquare
                icon={RefreshCw}
                sizeIcon={18}
                title="Actualizar"
                variant="white"
                onClick={refetch}
                animate={isLoading ? 'animate-spin' : ''}
              />
              <Button variant="black" onClick={handleOpenCreate} icon={Plus}>
                Nuevo Ítem
              </Button>
            </>
          )}
          {tab === 'proveedores' && (
            <Button
              variant="black"
              onClick={() => openDrawer('ITEM_PROVEEDOR_FORM')}
              icon={Plus}
            >
              Agregar Producto
            </Button>
          )}
        </div>
      </div>

      <PageTabs tabs={TABS} value={tab} onChange={setTab} size="lg" />

      {tab === 'productos' && (
        <>
          <CatalogoTable
            items={items}
            isLoading={isLoading}
            onSelect={handleSelect}
            initialSearch={initialQ}
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
        </>
      )}

      {tab === 'stock' && (
        <InventarioGlobalPage embedded />
      )}

      {tab === 'proveedores' && (
        <CatalogoTab />
      )}

      <ItemProveedorForm />
      <ConfirmModal />
    </div>
  );
};

export default CatalogoPage;

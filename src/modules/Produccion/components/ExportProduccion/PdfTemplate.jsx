import { forwardRef } from 'react';
import logoFallback from '../../../../assets/pincaicono.png';
import { EMPRESA_FALLBACK } from '../../../../utils/empresaInfo';
import { fmt } from './helpers';

export const PdfTemplate = forwardRef(({ preparacion, items, modo, empresa: EMPRESA = EMPRESA_FALLBACK, logoUrl = logoFallback }, ref) => {
  const logo = logoUrl;
  const isMuestrario = modo === 'MUESTRARIO';

  return (
    <div ref={ref} style={{
      fontFamily: 'Arial, sans-serif', fontSize: '11px',
      color: '#1a1a1a', background: '#fff',
      width: '794px', padding: '48px', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={logo} alt="Pinca" style={{ height: '64px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', maxWidth: '400px' }}>{EMPRESA.nombre}</div>
            <div style={{ color: '#555', marginTop: '4px', fontSize: '10px' }}>
              <div>{EMPRESA.nit}</div>
              <div>{EMPRESA.direccion}</div>
              <div>{EMPRESA.telefono}</div>
              <div>{EMPRESA.ciudad}</div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-1px' }}>
            {isMuestrario ? 'Orden de Seguimiento' : 'Orden de Producción'}
          </div>
          <div style={{ display: 'inline-block', marginTop: '4px', background: '#1a1a1a', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
            ORD-{String(preparacion.id_preparaciones).padStart(4, '0')}
          </div>
        </div>
      </div>

      <div style={{ height: '2px', background: '#e5e7eb', marginBottom: '20px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          { title: 'Producto a Fabricar', rows: [['Producto', preparacion.item_nombre], ['Código', preparacion.item_codigo], ['Presentación', preparacion.unidad_nombre], ['A producir', `${Number(preparacion.cantidad).toFixed(2)} envases`]] },
          { title: 'Información de Producción', rows: [['Estado', preparacion.estado], ['Fecha Inicio', preparacion.fecha_inicio ?? '—'], ['Fecha Fin', preparacion.fecha_fin ?? '—'], ['Creada', new Date(preparacion.fecha_creacion).toLocaleDateString('es-CO')]] },
        ].map(({ title, rows }) => (
          <div key={title} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', background: '#fafafa' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: '#666', padding: '4px 0', width: '90px', fontSize: '10px' }}>{k}</td>
                    <td style={{ fontWeight: '600', padding: '4px 0', fontSize: '10px' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: '#333' }}>
        Materias Primas / Insumos
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            {(isMuestrario
              ? [['Ítem', 'center', '40px'], ['Código', 'center', '80px'], ['Material', 'left', 'auto'], ['Cantidad', 'right', '80px'], ['Cant. Usada', 'center', '90px'], ['Lote', 'center', '90px'], ['Check', 'center', '50px']]
              : [['Ítem', 'center', '40px'], ['Código', 'center', '80px'], ['Material', 'left', 'auto'], ['Cantidad', 'right', '100px'], ['Vr. Unitario', 'right', '90px'], ['Costo Total', 'right', '90px']]
            ).map(([h, align, w]) => (
              <th key={h} style={{ padding: '8px 10px', textAlign: align, fontSize: '10px', fontWeight: '700', ...(w ? { width: w } : {}) }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.item_general_id ?? i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#666', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>{i + 1}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#666', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>{item.codigo}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: '10px', fontWeight: '600' }}>{item.nombre}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '10px', fontWeight: '700' }}>{Number(item.cantidad).toFixed(3)}</td>
              {isMuestrario ? (
                <>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}><div style={{ borderBottom: '1px solid #ccc', height: '14px', width: '100%' }}></div></td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}><div style={{ borderBottom: '1px solid #ccc', height: '14px', width: '100%' }}></div></td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}><div style={{ border: '1px solid #ccc', height: '14px', width: '14px', margin: '0 auto' }}></div></td>
                </>
              ) : (
                <>
                  <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '10px', color: '#666' }}>{fmt(item.materia_prima_costo_unitario)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '10px', fontWeight: '700' }}>{fmt(item.costo_total_materia)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {!isMuestrario && (
        <div style={{ textAlign: 'right', marginBottom: '32px', fontSize: '12px', fontWeight: '700', color: '#1a1a1a' }}>
          Total Materias Primas: {fmt(items.reduce((sum, item) => sum + (Number(item.costo_total_materia) || 0), 0))}
        </div>
      )}

      {preparacion.observaciones && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: '4px', color: '#666' }}>OBSERVACIONES</div>
          <div style={{ padding: '12px', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '10px', color: '#444' }}>
            {preparacion.observaciones}
          </div>
        </div>
      )}

      {isMuestrario && (
        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '80px' }}>
          {['Preparado por (Firma)', 'Revisado por (Firma)'].map((label) => (
            <div key={label} style={{ width: '250px', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '8px', fontSize: '10px', fontWeight: '600' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <img src={logo} alt="Pinca" style={{ height: '32px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '10px' }}>Pinturas Industriales Del Caribe</div>
            <div style={{ color: '#666', fontSize: '9px' }}>{EMPRESA.email}</div>
          </div>
        </div>
        <div style={{ fontSize: '9px', color: '#aaa', textAlign: 'right' }}>
          <div>Generado el {new Date().toLocaleDateString('es-CO')}</div>
        </div>
      </div>
    </div>
  );
});

export default PdfTemplate;

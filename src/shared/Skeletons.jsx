export const SkeletonCard = () => {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex min-h-44">
      {/* Barra lateral de color (ahora gris) */}
      <div className="w-1.5 bg-zinc-100 h-full shrink-0" />

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Título (Nombre de bodega) */}
          <div className="h-5 bg-zinc-200 rounded-md w-3/4 animate-pulse mb-2" />
          {/* Descripción */}
          <div className="h-3 bg-zinc-100 rounded-md w-full animate-pulse mb-1" />
          <div className="h-3 bg-zinc-100 rounded-md w-1/2 animate-pulse" />
        </div>

        {/* Detalles inferiores (Inventario y Estado) */}
        <div className="flex gap-4">
          <div className="h-4 bg-zinc-100 rounded w-16 animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-zinc-100">
    {/* # ID */}
    <td className="px-3 py-1 text-center">
      <div className="h-4 w-6 bg-zinc-200 rounded mx-auto"></div>
    </td>
    {/* CÓDIGO */}
    <td className="px-3 py-3">
      <div className="h-4 w-16 bg-zinc-200 rounded"></div>
    </td>
    {/* NOMBRE */}
    <td className="px-3 py-3">
      <div className="h-4 w-48 bg-zinc-200 rounded"></div>
    </td>
    {/* CANTIDAD */}
    <td className="px-3 py-1 text-center">
      <div className="h-4 w-10 bg-zinc-200 rounded mx-auto"></div>
    </td>
    {/* TIPO (Badge) */}
    <td className="px-3 py-1 text-center">
      <div className="h-6 w-24 bg-zinc-100 rounded-md mx-auto"></div>
    </td>
    {/* UNIDAD */}
    <td className="px-3 py-1 text-center">
      <div className="h-4 w-8 bg-zinc-100 rounded mx-auto"></div>
    </td>
    {/* COSTO */}
    <td className="px-3 py-1 text-right">
      <div className="h-4 w-16 bg-zinc-200 rounded ml-auto"></div>
    </td>
    {/* PRECIO */}
    <td className="px-3 py-1 text-right">
      <div className="h-4 w-16 bg-emerald-100 rounded ml-auto"></div>
    </td>
    {/* ACCIONES */}
    <td className="px-3 py-1 text-center">
      <div className="flex justify-center gap-2">
        <div className="h-8 w-8 bg-zinc-200 rounded"></div>
        <div className="h-8 w-8 bg-zinc-200 rounded"></div>
        <div className="h-8 w-8 bg-zinc-200 rounded"></div>
      </div>
    </td>
  </tr>
);
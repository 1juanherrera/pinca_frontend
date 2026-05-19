export const SkeletonCard = () => (
  <div className="bg-surface-base border border-border-base rounded-md overflow-hidden shadow-xs flex min-h-40">
    <div className="w-1 bg-surface-muted shrink-0" />
    <div className="p-3 flex-1 flex flex-col justify-between gap-3">
      <div className="space-y-2">
        <div className="h-4 bg-surface-muted rounded-sm w-3/4 animate-pulse" />
        <div className="h-3 bg-surface-muted rounded-sm w-full animate-pulse" />
        <div className="h-3 bg-surface-muted rounded-sm w-1/2 animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-3.5 bg-surface-muted rounded-sm w-16 animate-pulse" />
        <div className="h-3.5 bg-surface-muted rounded-sm w-16 animate-pulse" />
      </div>
    </div>
  </div>
);

export const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-border-subtle">
    <td className="px-3 py-1.5 text-center">
      <div className="h-3.5 w-6 bg-surface-muted rounded-sm mx-auto" />
    </td>
    <td className="px-3 py-1.5">
      <div className="h-3.5 w-16 bg-surface-muted rounded-sm" />
    </td>
    <td className="px-3 py-1.5">
      <div className="h-3.5 w-48 bg-surface-muted rounded-sm" />
    </td>
    <td className="px-3 py-1.5 text-center">
      <div className="h-3.5 w-10 bg-surface-muted rounded-sm mx-auto" />
    </td>
    <td className="px-3 py-1.5 text-center">
      <div className="h-5 w-20 bg-surface-muted rounded-sm mx-auto" />
    </td>
    <td className="px-3 py-1.5 text-center">
      <div className="h-3.5 w-8 bg-surface-muted rounded-sm mx-auto" />
    </td>
    <td className="px-3 py-1.5 text-right">
      <div className="h-3.5 w-16 bg-surface-muted rounded-sm ml-auto" />
    </td>
    <td className="px-3 py-1.5 text-right">
      <div className="h-3.5 w-16 bg-surface-muted rounded-sm ml-auto" />
    </td>
    <td className="px-3 py-1.5 text-center">
      <div className="flex justify-center gap-2">
        <div className="h-7 w-7 bg-surface-muted rounded-sm" />
        <div className="h-7 w-7 bg-surface-muted rounded-sm" />
        <div className="h-7 w-7 bg-surface-muted rounded-sm" />
      </div>
    </td>
  </tr>
);

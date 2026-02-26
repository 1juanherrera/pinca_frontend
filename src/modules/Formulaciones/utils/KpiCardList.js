import { Beaker, DollarSign, Layers, Package, Puzzle } from "lucide-react";

export const themeClasses = {
  blue: {
    value: 'text-blue-600',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-500',
    border: 'border-blue-100',
    bar: 'bg-blue-500'
  },
  amber: {
    value: 'text-amber-600',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-500',
    border: 'border-amber-100',
    bar: 'bg-amber-500'
  },
  purple: {
    value: 'text-purple-600',
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-500',
    border: 'border-purple-100',
    bar: 'bg-purple-500'
  },
  emerald: {
    value: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-500',
    border: 'border-emerald-100',
    bar: 'bg-emerald-500'
  },
  green: {
    value: 'text-green-700',
    iconBg: 'bg-green-50',
    iconText: 'text-green-600',
    border: 'border-green-100',
    bar: 'bg-green-600'
  }
};

export const statsData = [
    { label: 'Productos', value: '25', icon: Beaker, theme: 'blue' },
    { label: 'Insumos', value: '5', icon: Package, theme: 'amber' },
    { label: 'Total Items', value: '30', icon: Layers, theme: 'purple' },
    { label: 'Componentes', value: '6', icon: Puzzle, theme: 'emerald' },
    { label: 'Costo Total', value: '$ 8.499.404', icon: DollarSign, theme: 'green' },
  ];
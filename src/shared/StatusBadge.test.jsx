import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('<StatusBadge />', () => {
  it('renderiza el label cuando se pasa explícitamente', () => {
    render(<StatusBadge estado="Pendiente" label="Pendiente" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('usa el estado como label cuando no hay label prop', () => {
    render(<StatusBadge estado="Pagada" />);
    expect(screen.getByText('Pagada')).toBeInTheDocument();
  });

  it('aplica tone "success" para estado Pagada', () => {
    const { container } = render(<StatusBadge estado="Pagada" />);
    // El tone success-subtle usa el token semantic-success
    const badge = container.querySelector('span');
    expect(badge?.className).toMatch(/semantic-success/);
  });

  it('aplica tone "warning" para estado Pendiente', () => {
    const { container } = render(<StatusBadge estado="Pendiente" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toMatch(/semantic-warning/);
  });

  it('aplica tone "neutral" para estado Anulada', () => {
    const { container } = render(<StatusBadge estado="Anulada" />);
    const badge = container.querySelector('span');
    // Neutral subtle usa surface-strong / content-primary
    expect(badge?.className).toMatch(/(surface-strong|content-primary)/);
  });

  it('cae a tone neutral si el estado no está en el map', () => {
    const { container } = render(<StatusBadge estado="Desconocido" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toMatch(/(surface-strong|content-primary)/);
  });

  it('permite override de tone via prop', () => {
    const { container } = render(<StatusBadge estado="Pagada" tone="danger" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toMatch(/semantic-danger/);
  });

  it('aplica fixedWidth cuando se pasa la prop', () => {
    const { container } = render(<StatusBadge estado="Pendiente" fixedWidth size="md" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toMatch(/w-\[100px\]/);
  });

  it('aplica el minWidth por defecto', () => {
    const { container } = render(<StatusBadge estado="Pendiente" size="md" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toMatch(/min-w-\[100px\]/);
  });
});

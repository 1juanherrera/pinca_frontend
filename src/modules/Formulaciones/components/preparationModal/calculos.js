// ─── Helpers de cálculo puro (sin dependencias de UI) ─────────────────────────
export const round5 = (n) => Math.round(n * 100000) / 100000;

export const calcularCantidad = (volumen, escala) =>
  (!volumen || !escala || escala === 0) ? 0 : volumen / escala;

export const formatCantidad = (n) => {
  if (!n || n === 0) return '0';
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
};

export const esEntero = (n) => Number.isInteger(round5(n));

// Algoritmo greedy: cubre volumen con la menor cantidad de unidades posible
export const calcularCombinacion = (volumen, unidades) => {
  const sorted = [...unidades].sort((a, b) => parseFloat(b.escala) - parseFloat(a.escala));
  const resultado = [];
  let restante = round5(volumen);
  for (const u of sorted) {
    const escala = parseFloat(u.escala);
    if (escala <= 0) continue;
    const envases = Math.floor(round5(restante / escala));
    if (envases > 0) {
      resultado.push({
        unidad: u,
        envases,
        volumenCubierto: round5(envases * escala),
      });
      restante = round5(restante - envases * escala);
    }
    if (restante < 0.00001) break;
  }
  return resultado.filter(r => r.envases > 0);
};

// Escala materias primas proporcionalmente
export const escalarFormulaciones = (formulaciones, volumenTarget, volumenBase) => {
  const factor = volumenBase > 0 ? volumenTarget / volumenBase : 1;
  return formulaciones.map(mp => ({
    item_general_id: mp.item_general_id,
    cantidad: parseFloat((parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0) * factor).toFixed(4)),
  }));
};

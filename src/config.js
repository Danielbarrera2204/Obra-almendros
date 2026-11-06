// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE LA OBRA  (edita aquí, no hace falta tocar más)
// ─────────────────────────────────────────────────────────────
export const OBRA = {
  nombre: 'Intervención de cubiertas',
  conjunto: 'Conjunto residencial',
  // Apartamentos de cada bloque (los del último piso, donde está la cubierta)
  apartamentos: ['301', '302', '303', '304'],
};

// Estados posibles. El orden define el ciclo al tocar en la vista de lista.
export const ESTADOS = [
  { id: 0, clave: 'pendiente', etiqueta: 'Pendiente' },
  { id: 1, clave: 'proceso', etiqueta: 'En proceso' },
  { id: 2, clave: 'terminado', etiqueta: 'Terminado' },
];

// Clave donde se guarda el avance en el navegador.
// Si cambias esto, el avance guardado anterior deja de verse.
export const STORAGE_KEY = 'obra-cubiertas-v1';

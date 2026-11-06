// ─────────────────────────────────────────────────────────────
//  GEOMETRÍA DEL PLANO
//  Coordenadas en un lienzo de 1130 x 770 (mismo esquema del dibujo).
//  Si el plano cambia, edita x, y, w, h de cada bloque.
//  VISTA es el recuadro que se muestra (recorta los márgenes vacíos).
// ─────────────────────────────────────────────────────────────
export const VISTA = { x: 85, y: 50, w: 1000, h: 665 };

// Bloques interactivos: { id, x, y, w, h }
export const BLOQUES = [
  // Fila inferior (curva): 9 → 1
  { id: 9, x: 257, y: 578, w: 90, h: 110 },
  { id: 8, x: 347, y: 578, w: 94, h: 110 },
  { id: 7, x: 441, y: 578, w: 88, h: 110 },
  { id: 6, x: 529, y: 578, w: 90, h: 110 },
  { id: 5, x: 619, y: 578, w: 91, h: 110 },
  { id: 4, x: 710, y: 578, w: 97, h: 110 },
  { id: 3, x: 807, y: 578, w: 101, h: 110 },
  { id: 2, x: 908, y: 578, w: 86, h: 110 },
  { id: 1, x: 994, y: 578, w: 73, h: 110 },

  // Grupo 10–17
  { id: 17, x: 473, y: 405, w: 134, h: 61 },
  { id: 16, x: 607, y: 405, w: 123, h: 61 },
  { id: 15, x: 760, y: 405, w: 102, h: 61 },
  { id: 14, x: 862, y: 405, w: 98, h: 61 },
  { id: 10, x: 473, y: 467, w: 134, h: 63 },
  { id: 11, x: 607, y: 467, w: 123, h: 63 },
  { id: 12, x: 760, y: 467, w: 102, h: 63 },
  { id: 13, x: 862, y: 467, w: 98, h: 63 },

  // Grupo 18–24
  { id: 24, x: 662, y: 273, w: 208, h: 54 },
  { id: 23, x: 870, y: 273, w: 155, h: 54 },
  { id: 18, x: 662, y: 327, w: 61, h: 54 },
  { id: 19, x: 723, y: 327, w: 71, h: 54 },
  { id: 20, x: 794, y: 327, w: 76, h: 54 },
  { id: 21, x: 870, y: 327, w: 82, h: 54 },
  { id: 22, x: 952, y: 327, w: 73, h: 54 },

  // Fila 25–29
  { id: 25, x: 737, y: 188, w: 55, h: 53 },
  { id: 26, x: 792, y: 188, w: 55, h: 53 },
  { id: 27, x: 847, y: 188, w: 59, h: 53 },
  { id: 28, x: 906, y: 188, w: 58, h: 53 },
  { id: 29, x: 964, y: 188, w: 61, h: 53 },

  // 55 y 56 (junto al salón social)
  { id: 55, x: 730, y: 90, w: 51, h: 55 },
  { id: 56, x: 781, y: 90, w: 56, h: 55 },

  // Columna izquierda 30–40
  { id: 30, x: 113, y: 135, w: 106, h: 36 },
  { id: 31, x: 113, y: 172, w: 106, h: 35 },
  { id: 32, x: 113, y: 208, w: 106, h: 34 },
  { id: 33, x: 113, y: 243, w: 106, h: 32 },
  { id: 34, x: 113, y: 276, w: 106, h: 33 },
  { id: 35, x: 113, y: 310, w: 106, h: 38 },
  { id: 36, x: 113, y: 349, w: 106, h: 38 },
  { id: 37, x: 113, y: 388, w: 106, h: 38 },
  { id: 38, x: 113, y: 427, w: 106, h: 38 },
  { id: 39, x: 113, y: 466, w: 106, h: 43 },
  { id: 40, x: 113, y: 510, w: 106, h: 40 },

  // Grupo 41–47
  { id: 42, x: 318, y: 138, w: 63, h: 110 },
  { id: 41, x: 318, y: 249, w: 63, h: 99 },
  { id: 43, x: 381, y: 138, w: 63, h: 41 },
  { id: 44, x: 381, y: 180, w: 63, h: 44 },
  { id: 45, x: 381, y: 225, w: 63, h: 40 },
  { id: 46, x: 381, y: 266, w: 63, h: 45 },
  { id: 47, x: 381, y: 312, w: 63, h: 36 },

  // Grupo 48–54
  { id: 49, x: 485, y: 139, w: 74, h: 69 },
  { id: 48, x: 485, y: 208, w: 74, h: 57 },
  { id: 50, x: 559, y: 139, w: 76, h: 23 },
  { id: 51, x: 559, y: 162, w: 76, h: 26 },
  { id: 52, x: 559, y: 188, w: 76, h: 30 },
  { id: 53, x: 559, y: 218, w: 76, h: 25 },
  { id: 54, x: 559, y: 243, w: 76, h: 22 },
];

// Zonas de referencia (no se marcan, solo orientan)
export const ZONAS = [
  { id: 'admin', nombre: 'Admin', x: 113, y: 577, w: 104, h: 109, rotar: -45 },
  { id: 'entrada', nombre: 'Entrada', x: 234, y: 73, w: 98, h: 32 },
  { id: 'salon', nombre: 'Salón social', x: 837, y: 90, w: 153, h: 57 },
];

// Contorno redondeado que envuelve la fila 1–9 (detalle visual)
export const CONTORNO_CURVA = { x: 257, y: 578, w: 810, h: 110, r: 24 };

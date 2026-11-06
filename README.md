# Mapa de obra · Intervención de cubiertas

Plano interactivo del conjunto (56 bloques, 4 apartamentos por bloque: 301 a 304) para marcar el avance de la obra. Sitio estático hecho con [Astro](https://astro.build), sin base de datos.

## Qué hace

- Toca un bloque en el plano y marca cada apartamento como **Pendiente**, **En proceso** o **Terminado**.
- Cada apartamento admite una nota (por ejemplo "falta impermeabilizante").
- El bloque cambia de color según su avance y muestra una franja con sus 4 apartamentos.
- Filtros por estado (con contador), buscador de bloque, zoom y vista de **Lista** para marcar rápido desde el celular.
- **Exportar** a Excel, PDF o respaldo (.json). **Compartir avance** genera un resumen para WhatsApp.
- Funciona sin internet una vez abierto (PWA) y se puede instalar en el celular.

> El avance se guarda **en el navegador de cada dispositivo**. Para pasarlo a otro celular o computador: Exportar → *Guardar respaldo*, y en el otro dispositivo Exportar → *Cargar respaldo*.

## Abrirlo en VS Code

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:4321
```

## Qué editar

| Quieres cambiar… | Archivo |
| --- | --- |
| Nombre de la obra, apartamentos (301–304), nombres de estados | `src/config.js` |
| Posición y tamaño de los bloques en el plano | `src/data/plan.js` |
| Colores | variables al inicio de `src/styles/global.css` |
| Lógica (estados, exportar, compartir) | `src/scripts/app.js` y `src/scripts/exportar.js` |

Cada bloque en `plan.js` se define así: `{ id: 12, x: 760, y: 467, w: 102, h: 63 }`. Si el plano cambia, ajusta esos números.

## Subirlo a GitHub

```bash
git init
git add .
git commit -m "Mapa de obra"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/obra-cubiertas.git
git push -u origin main
```

(Crea antes el repositorio vacío en github.com.)

## Publicarlo en Netlify

1. En Netlify: **Add new site → Import an existing project → GitHub** y elige el repositorio.
2. Netlify lee `netlify.toml` solo: comando `npm run build`, carpeta `dist`.
3. **Deploy**. Cada `git push` publica la nueva versión automáticamente.

Alternativa sin GitHub: ejecuta `npm run build` y arrastra la carpeta `dist` a [app.netlify.com/drop](https://app.netlify.com/drop).

## Si algo no se actualiza en el celular

La app guarda una copia para funcionar sin internet. Si cambias algo y no se ve, abre `public/sw.js` y sube el número de `VERSION` (por ejemplo `obra-cubiertas-v2`).

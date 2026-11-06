// ─────────────────────────────────────────────────────────────
//  Mapa de obra · lógica de la página
//  - El avance se guarda en el navegador (localStorage), sin base de datos.
//  - Cada apartamento tiene un estado (0 pendiente, 1 en proceso, 2 terminado) y una nota.
// ─────────────────────────────────────────────────────────────
import { OBRA, ESTADOS, STORAGE_KEY } from '../config.js';
import { descargar, descargarExcel, descargarPDF, fechaISO } from './exportar.js';

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

const APTOS = OBRA.apartamentos;
const ETIQ = ESTADOS.map((e) => e.etiqueta);
const CLAVES = ESTADOS.map((e) => e.clave);
const MAX_S = ESTADOS.length - 1;

const svg = $('#plano');
const bloqueEls = new Map($$('.blk', svg).map((g) => [Number(g.dataset.id), g]));
const IDS = [...bloqueEls.keys()].sort((a, b) => a - b);
const TOTAL = IDS.length * APTOS.length;

const panel = $('#panel');
const panelBloque = $('#panel-bloque');
const panelVacio = $('#panel-vacio');
const velo = $('#velo');
const escritorio = window.matchMedia('(min-width: 1040px)');

/* ─── Datos y guardado ───────────────────────────────────── */
const vacio = () => ({ v: 1, apts: {} });

function validar(o) {
  if (!o || typeof o !== 'object' || !o.apts || typeof o.apts !== 'object') return null;
  const limpio = vacio();
  for (const [k, v] of Object.entries(o.apts)) {
    if (!/^\d+-\d+$/.test(k) || !v || typeof v !== 'object') continue;
    const s = Number(v.s);
    if (!Number.isInteger(s) || s < 0 || s > MAX_S) continue;
    const n = typeof v.n === 'string' ? v.n.slice(0, 120) : '';
    const t = Number.isFinite(v.t) ? v.t : null;
    if (s !== 0 || n) limpio.apts[k] = { s, n, t };
  }
  return limpio;
}

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw && validar(JSON.parse(raw))) || vacio();
  } catch {
    return vacio();
  }
}

let datos = cargar();

const llave = (b, a) => `${b}-${a}`;
const getS = (b, a) => datos.apts[llave(b, a)]?.s ?? 0;
const getN = (b, a) => datos.apts[llave(b, a)]?.n ?? '';
const getT = (b, a) => datos.apts[llave(b, a)]?.t ?? null;

function setApto(b, a, cambio) {
  const k = llave(b, a);
  const prev = datos.apts[k] || { s: 0, n: '', t: null };
  const sig = { s: cambio.s ?? prev.s, n: cambio.n ?? prev.n, t: prev.t };
  if (cambio.s !== undefined && cambio.s !== prev.s) sig.t = Date.now();
  if (sig.s === 0 && !sig.n) delete datos.apts[k];
  else datos.apts[k] = sig;
}

function guardar() {
  const aviso = $('#guardado');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    const h = new Date();
    aviso.textContent = `Guardado ${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}`;
  } catch {
    aviso.textContent = 'No se pudo guardar en este dispositivo';
  }
}

let temporizador;
function guardarConPausa() {
  clearTimeout(temporizador);
  temporizador = setTimeout(guardar, 400);
}

/* ─── Cálculos ───────────────────────────────────────────── */
function resumenBloque(id) {
  const c = new Array(ESTADOS.length).fill(0);
  for (const a of APTOS) c[getS(id, a)]++;
  const estado = c[MAX_S] === APTOS.length ? MAX_S : c[0] === APTOS.length ? 0 : 1;
  return { c, estado };
}

function fmtFecha(t) {
  return new Date(t).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function construirModelo() {
  const totales = new Array(ESTADOS.length).fill(0);
  const filas = IDS.map((id) => {
    const { c, estado } = resumenBloque(id);
    c.forEach((n, i) => (totales[i] += n));
    return {
      bloque: id,
      c,
      estado,
      pct: Math.round((c[MAX_S] / APTOS.length) * 100),
      aptos: APTOS.map((a) => ({ apto: a, s: getS(id, a), n: getN(id, a), t: getT(id, a) })),
    };
  });
  return { obra: OBRA, fecha: new Date(), filas, totales, total: TOTAL, pct: Math.round((totales[MAX_S] / TOTAL) * 100) };
}

/* ─── Pintar la interfaz ─────────────────────────────────── */
let filtro = 'todos';
let seleccionado = null;

function construirLista() {
  $('#lista').innerHTML = IDS.map(
    (id) => `
    <div class="tarjeta" data-id="${id}" data-estado="pendiente">
      <button type="button" class="tarjeta-titulo" aria-label="Abrir bloque ${id}"><b>${id}</b><span></span></button>
      <div class="chips">
        ${APTOS.map((a) => `<button type="button" class="chip" data-apto="${a}" data-s="0">${a}</button>`).join('')}
      </div>
    </div>`
  ).join('');
}

function pintar() {
  const totales = new Array(ESTADOS.length).fill(0);

  for (const id of IDS) {
    const { c, estado } = resumenBloque(id);
    c.forEach((n, i) => (totales[i] += n));
    const atenuar = filtro !== 'todos' && c[Number(filtro)] === 0;

    // Plano
    const g = bloqueEls.get(id);
    g.dataset.estado = CLAVES[estado];
    g.setAttribute('aria-label', `Bloque ${id}: ${c[MAX_S]} de ${APTOS.length} terminados, ${c[1]} en proceso, ${c[0]} pendientes`);
    g.classList.toggle('atenuado', atenuar);
    $$('.seg', g).forEach((r) => (r.dataset.s = getS(id, r.dataset.apto)));

    // Lista
    const card = $(`.tarjeta[data-id="${id}"]`);
    card.dataset.estado = CLAVES[estado];
    card.classList.toggle('atenuado', atenuar);
    $('.tarjeta-titulo span', card).textContent = `${c[MAX_S]} de ${APTOS.length} terminados`;
    $$('.chip', card).forEach((chip) => {
      const s = getS(id, chip.dataset.apto);
      chip.dataset.s = s;
      chip.setAttribute('aria-label', `Bloque ${id}, apartamento ${chip.dataset.apto}: ${ETIQ[s]}. Toca para cambiar`);
    });
  }

  // Avance general
  const pct = Math.round((totales[MAX_S] / TOTAL) * 100);
  $('#pct').textContent = `${pct}%`;
  $('#barra-ok').style.width = `${(totales[MAX_S] / TOTAL) * 100}%`;
  $('#barra-proc').style.width = `${(totales[1] / TOTAL) * 100}%`;
  $('.barra-avance').setAttribute('aria-label', `Avance general: ${pct}% terminado`);
  $('[data-cuenta="todos"]').textContent = TOTAL;
  totales.forEach((n, i) => ($(`[data-cuenta="${i}"]`).textContent = n));

  actualizarPanel();
}

/* ─── Panel del bloque ───────────────────────────────────── */
function construirPanel(id) {
  panelBloque.innerHTML = `
    <div class="panel-cab">
      <button type="button" class="icono-btn" id="bloque-prev" aria-label="Bloque anterior">‹</button>
      <div class="titulo">
        <h2 tabindex="-1">Bloque ${id}</h2>
        <p class="resumen" id="panel-resumen"></p>
      </div>
      <button type="button" class="icono-btn" id="bloque-sig" aria-label="Bloque siguiente">›</button>
      <button type="button" class="icono-btn" id="panel-cerrar" aria-label="Cerrar">✕</button>
    </div>
    <div class="aptos">
      ${APTOS.map(
        (a) => `
        <div class="apto" data-apto="${a}">
          <div class="apto-fila"><span class="apto-num">${a}</span><span class="apto-fecha"></span></div>
          <div class="estados" role="radiogroup" aria-label="Estado del apartamento ${a}">
            ${ESTADOS.map((e) => `<button type="button" role="radio" data-s="${e.id}" aria-checked="false">${e.etiqueta}</button>`).join('')}
          </div>
          <input class="nota" type="text" maxlength="120" placeholder="Agregar nota" aria-label="Nota del apartamento ${a}" />
        </div>`
      ).join('')}
    </div>
    <div class="bloque-todo">
      <p>Marcar los ${APTOS.length} apartamentos del bloque como:</p>
      <div class="estados" role="group" aria-label="Marcar todo el bloque">
        ${ESTADOS.map((e) => `<button type="button" data-todo="${e.id}"><i class="punto punto-${e.id}"></i>${e.etiqueta}</button>`).join('')}
      </div>
    </div>`;
}

function actualizarPanel() {
  if (seleccionado == null) return;
  const id = seleccionado;
  const { c } = resumenBloque(id);
  const resumen = $('#panel-resumen');
  if (!resumen) return;
  resumen.textContent = `${c[MAX_S]} de ${APTOS.length} terminados` + (c[1] ? `, ${c[1]} en proceso` : '');

  $$('.apto', panelBloque).forEach((el) => {
    const a = el.dataset.apto;
    const s = getS(id, a);
    $$('.estados button', el).forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.s) === s)));
    const t = getT(id, a);
    $('.apto-fecha', el).textContent = t ? `Cambió ${fmtFecha(t)}` : '';
    const inp = $('.nota', el);
    if (document.activeElement !== inp) inp.value = getN(id, a);
  });
}

function moverAnillo() {
  const anillo = $('#anillo');
  const g = seleccionado != null && bloqueEls.get(seleccionado);
  try {
    const bb = g && $('.bg', g).getBBox();
    if (bb && bb.width > 0) {
      anillo.setAttribute('x', bb.x - 1);
      anillo.setAttribute('y', bb.y - 1);
      anillo.setAttribute('width', bb.width + 2);
      anillo.setAttribute('height', bb.height + 2);
      return;
    }
  } catch {
    /* el plano no está visible */
  }
  if (seleccionado == null) {
    anillo.setAttribute('width', 0);
    anillo.setAttribute('height', 0);
  }
}

function verBloqueEnMapa(g) {
  const sc = $('#mapa-scroll');
  if (!sc || sc.offsetParent === null) return;
  const r = g.getBoundingClientRect();
  const c = sc.getBoundingClientRect();
  const dentro = r.left >= c.left && r.right <= c.right && r.top >= c.top && r.bottom <= c.bottom;
  if (dentro) return;
  sc.scrollBy({
    left: r.left - c.left - (c.width - r.width) / 2,
    top: r.top - c.top - (c.height - r.height) / 2,
    behavior: 'smooth',
  });
}

let ultimoFoco = null;

function abrir(id, origen) {
  if (!bloqueEls.has(id)) return;
  if (origen) ultimoFoco = origen;
  seleccionado = id;
  construirPanel(id);
  actualizarPanel();
  panelVacio.hidden = true;
  panelBloque.hidden = false;
  panel.classList.add('abierto');
  if (!escritorio.matches) {
    velo.hidden = false;
    $('h2', panelBloque).focus({ preventScroll: true });
  }
  moverAnillo();
  verBloqueEnMapa(bloqueEls.get(id));
}

function cerrar() {
  if (seleccionado == null) return;
  seleccionado = null;
  panel.classList.remove('abierto');
  velo.hidden = true;
  panelBloque.hidden = true;
  panelVacio.hidden = false;
  moverAnillo();
  if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
}

function vecino(paso) {
  const i = IDS.indexOf(seleccionado);
  return IDS[(i + paso + IDS.length) % IDS.length];
}

/* ─── Eventos: plano ─────────────────────────────────────── */
const pan = { activo: false, movio: false, x: 0, y: 0, sl: 0, st: 0 };
const mapaScroll = $('#mapa-scroll');

mapaScroll.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  pan.activo = true;
  pan.movio = false;
  pan.x = e.clientX;
  pan.y = e.clientY;
  pan.sl = mapaScroll.scrollLeft;
  pan.st = mapaScroll.scrollTop;
});

window.addEventListener('pointermove', (e) => {
  if (!pan.activo) return;
  const dx = e.clientX - pan.x;
  const dy = e.clientY - pan.y;
  if (!pan.movio && Math.hypot(dx, dy) > 6) pan.movio = true;
  if (pan.movio) {
    mapaScroll.scrollLeft = pan.sl - dx;
    mapaScroll.scrollTop = pan.st - dy;
  }
});

window.addEventListener('pointerup', () => {
  pan.activo = false;
});

svg.addEventListener('click', (e) => {
  if (pan.movio) {
    pan.movio = false;
    return;
  }
  const g = e.target.closest('.blk');
  if (g) abrir(Number(g.dataset.id), g);
});

svg.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const g = e.target.closest('.blk');
  if (!g) return;
  e.preventDefault();
  abrir(Number(g.dataset.id), g);
});

/* ─── Eventos: lista ─────────────────────────────────────── */
$('#lista').addEventListener('click', (e) => {
  const card = e.target.closest('.tarjeta');
  if (!card) return;
  const id = Number(card.dataset.id);
  const chip = e.target.closest('.chip');
  if (chip) {
    const a = chip.dataset.apto;
    setApto(id, a, { s: (getS(id, a) + 1) % ESTADOS.length });
    guardar();
    pintar();
    return;
  }
  const titulo = e.target.closest('.tarjeta-titulo');
  if (titulo) abrir(id, titulo);
});

/* ─── Eventos: panel ─────────────────────────────────────── */
panelBloque.addEventListener('click', (e) => {
  const id = seleccionado;
  const btnEstado = e.target.closest('.apto .estados button');
  if (btnEstado) {
    const a = btnEstado.closest('.apto').dataset.apto;
    setApto(id, a, { s: Number(btnEstado.dataset.s) });
    guardar();
    pintar();
    return;
  }
  const btnTodo = e.target.closest('[data-todo]');
  if (btnTodo) {
    const s = Number(btnTodo.dataset.todo);
    APTOS.forEach((a) => setApto(id, a, { s }));
    guardar();
    pintar();
    aviso(`Bloque ${id} marcado como ${ETIQ[s].toLowerCase()}`);
    return;
  }
  if (e.target.closest('#bloque-prev')) abrir(vecino(-1));
  else if (e.target.closest('#bloque-sig')) abrir(vecino(1));
  else if (e.target.closest('#panel-cerrar')) cerrar();
});

panelBloque.addEventListener('input', (e) => {
  const inp = e.target.closest('.nota');
  if (!inp) return;
  const a = inp.closest('.apto').dataset.apto;
  setApto(seleccionado, a, { n: inp.value.trim() });
  guardarConPausa();
});

velo.addEventListener('click', cerrar);

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#menu-export').hidden) cerrarMenu();
  else cerrar();
});

escritorio.addEventListener('change', () => {
  velo.hidden = escritorio.matches || seleccionado == null;
});

/* ─── Filtros y vistas ───────────────────────────────────── */
$$('.filtro').forEach((btn) =>
  btn.addEventListener('click', () => {
    filtro = btn.dataset.filtro;
    $$('.filtro').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    pintar();
  })
);

const VISTA_KEY = `${STORAGE_KEY}-vista`;
function ponerVista(v) {
  $$('.vista-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === v)));
  $('#mapa-vista').hidden = v !== 'mapa';
  $('#lista-vista').hidden = v !== 'lista';
  $('.zoom').hidden = v !== 'mapa';
  try {
    localStorage.setItem(VISTA_KEY, v);
  } catch {
    /* sin almacenamiento */
  }
  if (v === 'mapa') {
    if (!svg.style.width) {
      ponerAncho(anchoLegible());
      mapaScroll.scrollLeft = 0;
      mapaScroll.scrollTop = 0;
    }
    moverAnillo();
  }
}
$$('.vista-btn').forEach((b) => b.addEventListener('click', () => ponerVista(b.dataset.vista)));

$('#form-ir').addEventListener('submit', (e) => {
  e.preventDefault();
  const campo = $('#ir-bloque');
  const n = Number(campo.value);
  if (!bloqueEls.has(n)) {
    aviso(`Escribe un número de bloque del ${IDS[0]} al ${IDS[IDS.length - 1]}.`);
    return;
  }
  abrir(n, campo);
  campo.value = '';
  campo.blur();
});

/* ─── Zoom del plano ─────────────────────────────────────── */
const ANCHO_MIN_LEGIBLE = 820;
const anchoAjustado = () => mapaScroll.clientWidth;
const anchoLegible = () => Math.max(anchoAjustado(), ANCHO_MIN_LEGIBLE);

function ponerAncho(px) {
  if (mapaScroll.clientWidth === 0) return; // plano oculto
  const min = anchoAjustado();
  const nuevo = Math.min(Math.max(px, min), 4200);
  const cx = svg.clientWidth ? (mapaScroll.scrollLeft + mapaScroll.clientWidth / 2) / svg.clientWidth : 0.5;
  const cy = svg.clientHeight ? (mapaScroll.scrollTop + mapaScroll.clientHeight / 2) / svg.clientHeight : 0.5;
  svg.style.width = `${nuevo}px`;
  mapaScroll.scrollLeft = cx * svg.clientWidth - mapaScroll.clientWidth / 2;
  mapaScroll.scrollTop = cy * svg.clientHeight - mapaScroll.clientHeight / 2;
  moverAnillo();
}

$('#zoom-mas').addEventListener('click', () => ponerAncho(svg.clientWidth * 1.35));
$('#zoom-menos').addEventListener('click', () => ponerAncho(svg.clientWidth / 1.35));
$('#zoom-reset').addEventListener('click', () => {
  const ajustado = Math.abs(svg.clientWidth - anchoAjustado()) < 2;
  ponerAncho(ajustado ? anchoLegible() : anchoAjustado());
});

window.addEventListener('resize', () => {
  if (svg.style.width && svg.clientWidth < anchoAjustado()) ponerAncho(anchoAjustado());
});

/* ─── Avisos ─────────────────────────────────────────────── */
let tAviso;
function aviso(texto) {
  const el = $('#toast');
  el.textContent = texto;
  el.hidden = false;
  clearTimeout(tAviso);
  tAviso = setTimeout(() => (el.hidden = true), 3200);
}

/* ─── Menú de exportar ───────────────────────────────────── */
const menu = $('#menu-export');
const btnExport = $('#btn-export');

function cerrarMenu() {
  menu.hidden = true;
  btnExport.setAttribute('aria-expanded', 'false');
}

btnExport.addEventListener('click', (e) => {
  e.stopPropagation();
  menu.hidden = !menu.hidden;
  btnExport.setAttribute('aria-expanded', String(!menu.hidden));
  if (!menu.hidden) $('button', menu).focus();
});

document.addEventListener('click', (e) => {
  if (!menu.hidden && !e.target.closest('.menu-contenedor')) cerrarMenu();
});

async function conAviso(texto, tarea) {
  aviso(texto);
  try {
    await tarea();
    aviso('Listo, el archivo se descargó');
  } catch (err) {
    console.error(err);
    aviso('No se pudo crear el archivo. Intenta de nuevo con internet.');
  }
}

menu.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-accion]');
  if (!btn) return;
  const accion = btn.dataset.accion;
  cerrarMenu();

  if (accion === 'excel') {
    await conAviso('Creando Excel…', () => descargarExcel(construirModelo()));
  } else if (accion === 'pdf') {
    await conAviso('Creando PDF…', () => descargarPDF(construirModelo()));
  } else if (accion === 'respaldo') {
    const blob = new Blob([JSON.stringify({ ...datos, exportado: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    descargar(blob, `respaldo-cubiertas-${fechaISO(new Date())}.json`);
    aviso('Respaldo guardado. Con él puedes pasar el avance a otro dispositivo.');
  } else if (accion === 'cargar') {
    $('#file-respaldo').click();
  } else if (accion === 'borrar') {
    if (window.confirm('Se borrará todo el avance y las notas de este dispositivo. ¿Continuar?')) {
      datos = vacio();
      guardar();
      pintar();
      aviso('Avance borrado');
    }
  }
});

$('#file-respaldo').addEventListener('change', async (e) => {
  const archivo = e.target.files[0];
  e.target.value = '';
  if (!archivo) return;
  try {
    const nuevo = validar(JSON.parse(await archivo.text()));
    if (!nuevo) throw new Error('formato');
    const n = Object.keys(nuevo.apts).length;
    if (!window.confirm(`El respaldo trae ${n} apartamentos con avance o notas. Reemplaza lo que hay en este dispositivo. ¿Continuar?`)) return;
    datos = nuevo;
    guardar();
    pintar();
    aviso('Respaldo cargado');
  } catch {
    aviso('Ese archivo no es un respaldo válido de esta obra.');
  }
});

/* ─── Compartir avance (WhatsApp) ────────────────────────── */
function comprimir(ids) {
  const o = [...ids].sort((a, b) => a - b);
  const salida = [];
  let i = 0;
  while (i < o.length) {
    let j = i;
    while (j + 1 < o.length && o[j + 1] === o[j] + 1) j++;
    salida.push(j - i >= 2 ? `${o[i]}-${o[j]}` : o.slice(i, j + 1).join(', '));
    i = j + 1;
  }
  return salida.join(', ');
}

function textoResumen() {
  const m = construirModelo();
  const fecha = m.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const terminados = m.filas.filter((f) => f.estado === MAX_S).map((f) => f.bloque);
  const proceso = m.filas.filter((f) => f.estado === 1);
  const sinIniciar = m.filas.filter((f) => f.estado === 0).map((f) => f.bloque);

  const l = [
    `*${OBRA.nombre}*`,
    `Avance al ${fecha}`,
    '',
    `Terminados: ${m.totales[MAX_S]} de ${m.total} apartamentos (${m.pct}%)`,
    `En proceso: ${m.totales[1]}`,
    `Pendientes: ${m.totales[0]}`,
  ];
  if (terminados.length) l.push('', `Bloques terminados: ${comprimir(terminados)}`);
  if (proceso.length) l.push('', `Bloques en proceso (apartamentos terminados): ${proceso.map((f) => `${f.bloque} (${f.c[MAX_S]}/${APTOS.length})`).join(', ')}`);
  if (sinIniciar.length) l.push('', `Bloques sin iniciar: ${comprimir(sinIniciar)}`);
  return l.join('\n');
}

$('#btn-compartir').addEventListener('click', async () => {
  const texto = textoResumen();
  if (navigator.share) {
    try {
      await navigator.share({ text: texto });
    } catch {
      /* la persona cerró el menú de compartir */
    }
    return;
  }
  const w = window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  if (!w) {
    try {
      await navigator.clipboard.writeText(texto);
      aviso('Resumen copiado. Pégalo en WhatsApp.');
    } catch {
      aviso('No se pudo abrir WhatsApp.');
    }
  }
});

/* ─── Arranque ───────────────────────────────────────────── */
construirLista();
pintar();
let vistaInicial = 'mapa';
try {
  vistaInicial = localStorage.getItem(VISTA_KEY) === 'lista' ? 'lista' : 'mapa';
} catch {
  /* sin almacenamiento */
}
ponerVista(vistaInicial);
if (vistaInicial === 'mapa') {
  ponerAncho(anchoLegible());
  mapaScroll.scrollLeft = 0;
  mapaScroll.scrollTop = 0;
}

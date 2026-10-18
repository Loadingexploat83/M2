import './style.css';
import { obtenerLista } from './api.js';
import {
  normalizarObjetos,
  filtrarObjetos,
  ordenarObjetos,
  convertirNumero,
  resumirEquipamiento,
  comprobarRequisitos
} from './logic.js';
import {
  mostrarCatalogo,
  mostrarRanuras,
  mostrarStatsCombinadas,
  mostrarBuildsGuardadas
} from './render.js';

const $ = selector => document.querySelector(selector);

const catalogList = $('#catalogList');
const catalogState = $('#catalogState');
const catalogCount = $('#catalogCount');
const searchInput = $('#catalogSearch');
const sortSelect = $('#catalogSort');
const slotsElement = $('#equipmentSlots');
const totalWeightElement = $('#totalWeight');
const equippedCountElement = $('#equippedCount');
const combinedStatsElement = $('#combinedStats');
const requirementsStatus = $('#requirementsStatus');
const savedBuildsElement = $('#savedBuilds');
const saveState = $('#saveState');
const buildNameInput = $('#buildName');

const ATTRIBUTES = [
  ['Str', 'Fuerza'],
  ['Dex', 'Destreza'],
  ['Int', 'Inteligencia'],
  ['Fai', 'Fe'],
  ['Arc', 'Arcano']
];

const STORAGE_KEY = 'eldenring-saved-builds-v1';
const SLOT_KEYS = ['arma', 'head', 'chest', 'arms', 'legs'];
const DEFAULT_ATTRIBUTES = { Str: 10, Dex: 10, Int: 10, Fai: 10, Arc: 10 };

let categoriaActual = 'weapons';
let catalogo = { weapons: [], armors: [] };
let peticionId = 0;
let build = {
  nombre: '',
  equipamiento: { arma: null, head: null, chest: null, arms: null, legs: null },
  atributos: { ...DEFAULT_ATTRIBUTES }
};

function normalizarStatsGuardadas(stats) {
  if (!Array.isArray(stats)) return [];
  return stats
    .filter(stat => stat && typeof stat.name === 'string')
    .map(stat => ({
      name: stat.name,
      amount: convertirNumero(stat.amount) ?? 0
    }));
}

function normalizarObjetoGuardado(item, tipo) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  if (typeof item.nombre !== 'string' || !item.nombre.trim()) return null;

  const peso = convertirNumero(item.peso);
  const escalado = Array.isArray(item.escalado)
    ? item.escalado
        .filter(stat => stat && typeof stat.name === 'string')
        .map(stat => ({ name: stat.name, scaling: stat.scaling }))
    : [];

  return {
    id: typeof item.id === 'string' || typeof item.id === 'number'
      ? item.id
      : item.nombre.trim(),
    nombre: item.nombre.trim(),
    imagen: typeof item.imagen === 'string' ? item.imagen : '',
    descripcion: typeof item.descripcion === 'string'
      ? item.descripcion
      : 'Sin descripción disponible.',
    peso: peso !== null && peso >= 0 ? peso : null,
    categoria: typeof item.categoria === 'string' ? item.categoria : 'Sin categoría',
    ataque: normalizarStatsGuardadas(item.ataque),
    defensaArma: normalizarStatsGuardadas(item.defensaArma),
    negacionDanio: normalizarStatsGuardadas(item.negacionDanio),
    resistencia: normalizarStatsGuardadas(item.resistencia),
    escalado,
    requisitos: normalizarStatsGuardadas(item.requisitos),
    tipo
  };
}

function normalizarBuild(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null;
  const equipo = datos.equipamiento;
  if (!equipo || typeof equipo !== 'object' || Array.isArray(equipo)) return null;

  const equipamiento = {
    arma: normalizarObjetoGuardado(equipo.arma, 'weapons'),
    head: normalizarObjetoGuardado(equipo.head, 'armors'),
    chest: normalizarObjetoGuardado(equipo.chest, 'armors'),
    arms: normalizarObjetoGuardado(equipo.arms, 'armors'),
    legs: normalizarObjetoGuardado(equipo.legs, 'armors')
  };

  const atributosEntrada = datos.atributos && typeof datos.atributos === 'object'
    ? datos.atributos
    : {};
  const atributos = Object.fromEntries(
    ATTRIBUTES.map(([key]) => {
      const value = convertirNumero(atributosEntrada[key]);
      return [key, Math.min(99, Math.max(1, Math.trunc(value ?? DEFAULT_ATTRIBUTES[key])))];
    })
  );

  return {
    nombre: typeof datos.nombre === 'string' ? datos.nombre.slice(0, 60) : '',
    equipamiento,
    atributos
  };
}

function construirAtributos() {
  const container = $('#attributeInputs');
  container.replaceChildren();

  ATTRIBUTES.forEach(([key, label]) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'field attribute-field';
    const span = document.createElement('span');
    span.textContent = label;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '99';
    input.step = '1';
    input.value = String(build.atributos[key]);
    input.dataset.attribute = key;
    input.addEventListener('change', () => {
      const value = Math.min(99, Math.max(1, Math.trunc(Number(input.value) || 1)));
      build.atributos[key] = value;
      input.value = String(value);
      actualizarRequisitos();
    });

    wrapper.append(span, input);
    container.append(wrapper);
  });
}

function renderizarBuild() {
  mostrarRanuras(build.equipamiento, slotsElement, quitarPieza);

  const resumen = resumirEquipamiento(build.equipamiento);
  totalWeightElement.textContent = resumen.peso.toFixed(1);
  equippedCountElement.textContent = `${resumen.piezas} / 5`;
  mostrarStatsCombinadas(resumen, combinedStatsElement);
  actualizarRequisitos();
}

function actualizarRequisitos() {
  const resultado = comprobarRequisitos(build.equipamiento.arma, build.atributos);
  requirementsStatus.className = 'status';

  if (!build.equipamiento.arma) {
    requirementsStatus.textContent = 'Equipa un arma para comprobar sus requisitos.';
    return;
  }

  if (resultado.valido) {
    requirementsStatus.textContent = 'Cumples los requisitos de atributos del arma.';
    requirementsStatus.classList.add('status-success');
  } else {
    requirementsStatus.textContent = `Te faltan atributos: ${resultado.faltantes
      .map(item => `${item.nombre} ${item.actual}/${item.requerido}`)
      .join(', ')}.`;
    requirementsStatus.classList.add('status-warning');
  }
}

function asignarObjeto(item) {
  if (item.tipo === 'weapons' || categoriaActual === 'weapons') {
    build.equipamiento.arma = item;
  } else {
    const category = (item.categoria || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    let slot = 'chest';

    if (category.includes('head') || category.includes('helm')) {
      slot = 'head';
    } else if (
      category.includes('leg') ||
      category.includes('greave') ||
      category.includes('trouser') ||
      category.includes('pants')
    ) {
      slot = 'legs';
    } else if (
      category.includes('chest') ||
      category.includes('torso') ||
      category.includes('body')
    ) {
      slot = 'chest';
    } else if (
      category.includes('gauntlet') ||
      category.includes('glove') ||
      category.includes('hand armor') ||
      category === 'arms'
    ) {
      slot = 'arms';
    }

    build.equipamiento[slot] = item;
  }

  renderizarBuild();
}

function quitarPieza(slot) {
  if (!SLOT_KEYS.includes(slot)) return;
  build.equipamiento[slot] = null;
  renderizarBuild();
}

function renderizarCatalogo() {
  const objetos = catalogo[categoriaActual] ?? [];
  const listaFiltrada = filtrarObjetos(objetos, { busqueda: searchInput.value });
  const lista = ordenarObjetos(listaFiltrada, sortSelect.value);
  catalogCount.textContent = `${lista.length} objetos`;
  mostrarCatalogo(lista, catalogList, categoriaActual, asignarObjeto);
}

async function cargarCategoria(categoria) {
  if (!Object.hasOwn(catalogo, categoria)) return;

  categoriaActual = categoria;
  const id = ++peticionId;
  document.querySelectorAll('[data-category]').forEach(button => {
    button.classList.toggle('active', button.dataset.category === categoria);
  });

  catalogState.textContent = 'Cargando catálogo…';
  catalogState.classList.add('status-loading');
  catalogList.replaceChildren();

  if (catalogo[categoria].length) {
    catalogState.textContent = 'Catálogo cargado desde la memoria de la sesión.';
    catalogState.classList.remove('status-loading');
    renderizarCatalogo();
    return;
  }

  try {
    const datos = await obtenerLista(categoria);
    if (id !== peticionId) return;

    catalogo[categoria] = normalizarObjetos(datos)
      .filter(item => item.tipo === categoria);

    catalogState.textContent = `Catálogo de ${categoria === 'weapons' ? 'armas' : 'armaduras'} listo.`;
    renderizarCatalogo();
  } catch (error) {
    if (id !== peticionId) return;

    catalogState.textContent = `${error.message}. Comprueba la conexión y vuelve a intentarlo.`;
    const retry = document.createElement('button');
    retry.className = 'button button-primary';
    retry.type = 'button';
    retry.textContent = 'Reintentar';
    retry.addEventListener('click', () => cargarCategoria(categoria));
    catalogList.append(retry);
  } finally {
    if (id === peticionId) catalogState.classList.remove('status-loading');
  }
}

function leerBuildsGuardadas() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(data)) return [];

    return data.flatMap(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      if (typeof item.id !== 'string' && typeof item.id !== 'number') return [];

      const buildNormalizada = normalizarBuild(item);
      if (!buildNormalizada) return [];

      return [{
        id: String(item.id),
        nombre: buildNormalizada.nombre || 'Build sin nombre',
        actualizada: typeof item.actualizada === 'string' ? item.actualizada : '',
        equipamiento: buildNormalizada.equipamiento,
        atributos: buildNormalizada.atributos
      }];
    });
  } catch (error) {
    console.warn('No se pudieron leer las builds guardadas:', error);
    return [];
  }
}

function guardarBuild() {
  const nombre = buildNameInput.value.trim() || `Build ${new Date().toLocaleDateString()}`;
  build.nombre = nombre;

  const builds = leerBuildsGuardadas();
  const nueva = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    nombre,
    actualizada: new Date().toISOString(),
    equipamiento: build.equipamiento,
    atributos: build.atributos
  };

  builds.unshift(nueva);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds.slice(0, 30)));
    saveState.textContent = 'Build guardada en este navegador.';
    renderizarBuildsGuardadas();
  } catch (error) {
    saveState.textContent = 'No se pudo guardar. Puede que el almacenamiento esté lleno o bloqueado.';
    console.error(error);
  }
}

function cargarBuildGuardada(guardada) {
  const normalizada = normalizarBuild(guardada);
  if (!normalizada) {
    saveState.textContent = 'No se pudo cargar: la estructura de la build no es válida.';
    return;
  }

  build = normalizada;
  buildNameInput.value = build.nombre;
  construirAtributos();
  renderizarBuild();
  saveState.textContent = `Cargada: ${build.nombre || 'Build sin nombre'}`;
}

function eliminarBuild(id) {
  try {
    const builds = leerBuildsGuardadas().filter(item => item.id !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
    renderizarBuildsGuardadas();
    saveState.textContent = 'Build eliminada.';
  } catch (error) {
    saveState.textContent = 'No se pudo eliminar la build. Comprueba el almacenamiento del navegador.';
    console.error(error);
  }
}

function renderizarBuildsGuardadas() {
  mostrarBuildsGuardadas(leerBuildsGuardadas(), savedBuildsElement, {
    onCargar: cargarBuildGuardada,
    onEliminar: eliminarBuild
  });
}

function exportarBuild() {
  const data = {
    formato: 'elden-ring-kit-builder',
    version: 1,
    exportado: new Date().toISOString(),
    build: {
      nombre: buildNameInput.value.trim() || build.nombre || 'Build sin nombre',
      equipamiento: build.equipamiento,
      atributos: build.atributos
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(data.build.nombre || 'build').replace(/[^a-z0-9-_]+/gi, '_')}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  saveState.textContent = 'Build exportada.';
}

async function importarBuild(file) {
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('El archivo JSON debe contener un objeto.');
    }

    const incoming = data.build ?? data;
    const normalizada = normalizarBuild(incoming);
    if (!normalizada) {
      throw new Error('El archivo no contiene un equipamiento válido.');
    }

    cargarBuildGuardada(normalizada);
    saveState.textContent = 'Build importada correctamente.';
  } catch (error) {
    saveState.textContent = `No se pudo importar: ${error.message}`;
  }
}

document.querySelectorAll('[data-category]').forEach(button => {
  button.addEventListener('click', () => cargarCategoria(button.dataset.category));
});
searchInput.addEventListener('input', renderizarCatalogo);
sortSelect.addEventListener('change', renderizarCatalogo);
$('#saveBuild').addEventListener('click', guardarBuild);
$('#exportBuild').addEventListener('click', exportarBuild);
$('#importBuild').addEventListener('change', event => {
  importarBuild(event.target.files?.[0]);
  event.target.value = '';
});
buildNameInput.addEventListener('input', () => { build.nombre = buildNameInput.value; });

construirAtributos();
renderizarBuild();
renderizarBuildsGuardadas();
cargarCategoria('weapons');

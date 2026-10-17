import './style.css';
import { obtenerLista } from './api.js';
import {
  normalizarObjetos,
  filtrarObjetos,
  ordenarObjetos,
  ordenarPorEscalado,
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

let categoriaActual = 'weapons';
let catalogo = { weapons: [], armors: [] };
let cargando = false;
let peticionId = 0;
let build = {
  nombre: '',
  equipamiento: { arma: null, head: null, chest: null, arms: null, legs: null },
  atributos: { Str: 10, Dex: 10, Int: 10, Fai: 10, Arc: 10 }
};

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
      const value = Math.min(99, Math.max(1, Number(input.value) || 1));
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
    const category = (item.categoria || '').toLowerCase();
    let slot = 'chest';

    if (category.includes('head') || category.includes('helm')) slot = 'head';
    else if (category.includes('arm') || category.includes('gauntlet') || category.includes('glove')) slot = 'arms';
    else if (category.includes('leg') || category.includes('greave')) slot = 'legs';
    else if (category.includes('chest') || category.includes('body')) slot = 'chest';

    build.equipamiento[slot] = item;
  }

  renderizarBuild();
}

function quitarPieza(slot) {
  build.equipamiento[slot] = null;
  renderizarBuild();
}

function filtrosActuales() {
  return {
    busqueda: searchInput.value,
    ...(categoriaActual === 'weapons'
      ? { tipoDanio: '' }
      : {})
  };
}

function renderizarCatalogo() {
  const objetos = catalogo[categoriaActual] ?? [];
  let lista = filtrarObjetos(objetos, filtrosActuales());
  lista = ordenarObjetos(lista, sortSelect.value);
  catalogCount.textContent = `${lista.length} objetos`;
  mostrarCatalogo(lista, catalogList, categoriaActual, asignarObjeto);
}

async function cargarCategoria(categoria) {
  categoriaActual = categoria;
  const id = ++peticionId;
  document.querySelectorAll('[data-category]').forEach(button => {
    button.classList.toggle('active', button.dataset.category === categoria);
  });

  catalogState.textContent = 'Cargando catálogo…';
  catalogList.replaceChildren();

  if (catalogo[categoria].length) {
    catalogState.textContent = 'Catálogo cargado desde la memoria de la sesión.';
    renderizarCatalogo();
    return;
  }

  cargando = true;
  try {
    const datos = await obtenerLista(categoria);
    if (id !== peticionId) return;
    catalogo[categoria] = normalizarObjetos(datos).filter(item => item.tipo === categoria);
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
    if (id === peticionId) cargando = false;
  }
}

function leerBuildsGuardadas() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function guardarBuild() {
  const nombre = buildNameInput.value.trim() || `Build ${new Date().toLocaleDateString()}`;
  build.nombre = nombre;

  const builds = leerBuildsGuardadas();
  const nueva = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
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
  build = {
    nombre: guardada.nombre ?? '',
    equipamiento: {
      arma: guardada.equipamiento?.arma ?? null,
      head: guardada.equipamiento?.head ?? null,
      chest: guardada.equipamiento?.chest ?? null,
      arms: guardada.equipamiento?.arms ?? null,
      legs: guardada.equipamiento?.legs ?? null
    },
    atributos: { ...{ Str: 10, Dex: 10, Int: 10, Fai: 10, Arc: 10 }, ...(guardada.atributos ?? {}) }
  };

  buildNameInput.value = build.nombre;
  construirAtributos();
  renderizarBuild();
  saveState.textContent = `Cargada: ${build.nombre}`;
}

function eliminarBuild(id) {
  const builds = leerBuildsGuardadas().filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  renderizarBuildsGuardadas();
  saveState.textContent = 'Build eliminada.';
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
  URL.revokeObjectURL(url);
  saveState.textContent = 'Build exportada.';
}

async function importarBuild(file) {
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const incoming = data.build ?? data;

    if (!incoming.equipamiento || typeof incoming.equipamiento !== 'object') {
      throw new Error('El archivo no contiene un equipamiento válido.');
    }

    cargarBuildGuardada({
      nombre: incoming.nombre ?? 'Build importada',
      equipamiento: incoming.equipamiento,
      atributos: incoming.atributos
    });
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

import './style.css';

import { obtenerLista } from './api.js';
import {
  normalizarObjetos,
  filtrarObjetos,
  ordenarObjetos,
  convertirNumero
} from './logic.js';
import { mostrarObjetos } from './render.js';

const botones = {
  armors: document.querySelector('#ArmorButton'),
  weapons: document.querySelector('#WeaponButton'),
  items: document.querySelector('#ItemButton')
};

const contenedor = document.querySelector('#objectList');
const titulo = document.querySelector('#catalogTitle');
const estado = document.querySelector('#state');
const filtrosArmas = document.querySelector('#weaponFilters');
const filtrosArmaduras = document.querySelector('#armorFilters');

let categoriaActual = '';
let objetosActuales = [];
let idPeticion = 0;

Object.entries(botones).forEach(([categoria, boton]) => {
  boton.addEventListener('click', () => cargarCategoria(categoria));
});

async function cargarCategoria(categoria) {
  categoriaActual = categoria;
  const miPeticion = ++idPeticion;

  titulo.textContent = {
    armors: 'Armaduras',
    weapons: 'Armas',
    items: 'Objetos'
  }[categoria];

  filtrosArmas.hidden = categoria !== 'weapons';
  filtrosArmaduras.hidden = categoria !== 'armors';

  contenedor.replaceChildren();
  estado.textContent = 'Cargando...';

  try {
    const datos = await obtenerLista(categoria);

    // Ignora las respuestas de peticiones anteriores.
    if (miPeticion !== idPeticion) return;

    objetosActuales = normalizarObjetos(datos);
    aplicarFiltros();
  } catch (error) {
    if (miPeticion !== idPeticion) return;

    console.error(`Error al cargar ${categoria}:`, error);
    objetosActuales = [];
    contenedor.replaceChildren();
    estado.textContent = 'No se pudo cargar la información. Inténtalo de nuevo.';
  }
}

function aplicarFiltros() {
  let filtros = {};
  let orden = 'name';

  if (categoriaActual === 'weapons') {
    filtros.busqueda = document.querySelector('#weaponSearch').value;
    orden = document.querySelector('#weaponSort').value;
  }

  if (categoriaActual === 'armors') {
    filtros.busqueda = document.querySelector('#armorSearch').value;
    filtros.pesoMin = convertirNumero(
      document.querySelector('#minWeight').value
    );
    filtros.pesoMax = convertirNumero(
      document.querySelector('#maxWeight').value
    );
    orden = document.querySelector('#armorSort').value;
  }

  const filtrados = filtrarObjetos(objetosActuales, filtros);
  const ordenados = ordenarObjetos(filtrados, orden);

  mostrarObjetos(ordenados, contenedor, estado, categoriaActual);
}

document.querySelector('#applyWeaponFilters')
  .addEventListener('click', aplicarFiltros);

document.querySelector('#applyArmorFilters')
  .addEventListener('click', aplicarFiltros);

document.querySelector('#clearWeaponFilters')
  .addEventListener('click', () => {
    document.querySelector('#weaponSearch').value = '';
    document.querySelector('#weaponSort').value = 'name';
    document.querySelector('#weaponDamageType').value = '';
    aplicarFiltros();
  });

document.querySelector('#clearArmorFilters')
  .addEventListener('click', () => {
    [
      '#armorSearch',
      '#minWeight',
      '#maxWeight',
      '#minDefense',
      '#minResistance'
    ].forEach(selector => {
      document.querySelector(selector).value = '';
    });

    document.querySelector('#armorSort').value = 'name';
    document.querySelector('#armorDefenseType').value = '';
    document.querySelector('#armorResistanceType').value = '';
    aplicarFiltros();
  });

const RANGO_ESCALADO = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1
};

export function normalizarObjetos(datos) {
  return datos
    .map(item => ({
      id: item.id ?? item.name,
      nombre: typeof item.name === 'string'
        ? item.name.trim()
        : '',
      imagen: typeof item.image === 'string'
        ? item.image
        : '',
      descripcion: typeof item.description === 'string'
        ? item.description
        : 'Sin descripción disponible.',
      peso: convertirNumero(item.weight),
      categoria: typeof item.category === 'string'
        ? item.category
        : 'Sin categoría',
      ataque: Array.isArray(item.attack) ? item.attack : [],
      defensa: Array.isArray(item.dmgNegation)
        ? item.dmgNegation
        : [],
      resistencia: Array.isArray(item.resistance)
        ? item.resistance
        : [],
      datosOriginales: item
    }))
    .filter(item => item.nombre.length > 0);
}

export function convertirNumero(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function filtrarObjetos(objetos, filtros = {}) {
  const busqueda = (filtros.busqueda ?? '').trim().toLowerCase();

  return objetos.filter(item => {
    if (
      busqueda &&
      !item.nombre.toLowerCase().includes(busqueda)
    ) {
      return false;
    }

    if (
      filtros.pesoMin != null &&
      (item.peso === null || item.peso < filtros.pesoMin)
    ) {
      return false;
    }

    if (
      filtros.pesoMax != null &&
      (item.peso === null || item.peso > filtros.pesoMax)
    ) {
      return false;
    }

    return true;
  });
}

export function ordenarObjetos(objetos, orden = 'name') {
  return [...objetos].sort((a, b) => {
    if (orden === 'weight-asc') {
      return (a.peso ?? Infinity) - (b.peso ?? Infinity);
    }

    if (orden === 'weight-desc') {
      return (b.peso ?? -Infinity) - (a.peso ?? -Infinity);
    }

    return a.nombre.localeCompare(b.nombre);
  });
}

export function resumirObjetos(objetos) {
  const pesos = objetos
    .map(item => item.peso)
    .filter(peso => peso !== null);

  const pesoTotal = pesos.reduce((total, peso) => total + peso, 0);

  const porCategoria = objetos.reduce((resumen, item) => {
    resumen[item.categoria] = (resumen[item.categoria] ?? 0) + 1;
    return resumen;
  }, {});

  return {
    total: objetos.length,
    pesoMedio: pesos.length ? pesoTotal / pesos.length : null,
    porCategoria
  };
}


export function obtenerEscalado(arma, estadistica) {
  if (!Array.isArray(arma.scalesWith)) return 0;

  const dato = arma.scalesWith.find(
    item => item.name === estadistica
  );

  return RANGO_ESCALADO[dato?.scaling] ?? 0;
}

export function ordenarPorEscalado(armas, estadistica) {
  return [...armas].sort((a, b) => {
    const escaladoA = obtenerEscalado(a.datosOriginales ?? a, estadistica);
    const escaladoB = obtenerEscalado(b.datosOriginales ?? b, estadistica);

    return escaladoB - escaladoA;
  });
}
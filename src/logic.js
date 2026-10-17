export function convertirNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function normalizarStats(stats) {
  if (!Array.isArray(stats)) return [];
  return stats
    .filter(stat => stat && typeof stat.name === 'string')
    .map(stat => ({
      name: stat.name,
      amount: convertirNumero(stat.amount) ?? stat.amount ?? 0
    }));
}

export function normalizarObjetos(datos) {
  if (!Array.isArray(datos)) return [];

  return datos
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      id: item.id ?? item.name,
      nombre: typeof item.name === 'string' ? item.name.trim() : '',
      imagen: typeof item.image === 'string' ? item.image : '',
      descripcion: typeof item.description === 'string'
        ? item.description
        : 'Sin descripción disponible.',
      peso: convertirNumero(item.weight),
      categoria: typeof item.category === 'string' ? item.category : 'Sin categoría',
      ataque: normalizarStats(item.attack),
      defensaArma: normalizarStats(item.defence),
      negacionDanio: normalizarStats(item.dmgNegation),
      resistencia: normalizarStats(item.resistance),
      escalado: Array.isArray(item.scalesWith)
        ? item.scalesWith.filter(s => s && typeof s.name === 'string')
            .map(s => ({ name: s.name, scaling: s.scaling }))
        : [],
      requisitos: normalizarStats(item.requiredAttributes),
      tipo: Array.isArray(item.dmgNegation) || Array.isArray(item.resistance)
        ? 'armors'
        : Array.isArray(item.attack) || Array.isArray(item.scalesWith)
          ? 'weapons'
          : 'items'
    }))
    .filter(item => item.nombre);
}

export function filtrarObjetos(objetos, filtros = {}) {
  const query = (filtros.busqueda ?? '').trim().toLocaleLowerCase();

  return objetos.filter(item => {
    if (query && !item.nombre.toLocaleLowerCase().includes(query)) return false;

    if (filtros.pesoMin != null &&
      (item.peso === null || item.peso < filtros.pesoMin)) return false;
    if (filtros.pesoMax != null &&
      (item.peso === null || item.peso > filtros.pesoMax)) return false;

    if (filtros.tipoDanio) {
      const found = item.ataque.some(s =>
        s.name === filtros.tipoDanio && (convertirNumero(s.amount) ?? 0) > 0
      );
      if (!found) return false;
    }

    if (filtros.tipoDefensa) {
      const stat = item.negacionDanio.find(s => s.name === filtros.tipoDefensa);
      if (!stat) return false;
      if (filtros.defensaMin != null &&
        (convertirNumero(stat.amount) ?? -Infinity) < filtros.defensaMin) return false;
    } else if (filtros.defensaMin != null &&
      !item.negacionDanio.some(s => (convertirNumero(s.amount) ?? -Infinity) >= filtros.defensaMin)) {
      return false;
    }

    if (filtros.tipoResistencia) {
      const stat = item.resistencia.find(s => s.name === filtros.tipoResistencia);
      if (!stat) return false;
      if (filtros.resistenciaMin != null &&
        (convertirNumero(stat.amount) ?? -Infinity) < filtros.resistenciaMin) return false;
    } else if (filtros.resistenciaMin != null &&
      !item.resistencia.some(s => (convertirNumero(s.amount) ?? -Infinity) >= filtros.resistenciaMin)) {
      return false;
    }

    return true;
  });
}

export function ordenarObjetos(objetos, orden = 'name') {
  return [...objetos].sort((a, b) => {
    if (orden === 'weight-asc') return (a.peso ?? Infinity) - (b.peso ?? Infinity);
    if (orden === 'weight-desc') return (b.peso ?? -Infinity) - (a.peso ?? -Infinity);
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

const RANGO_ESCALADO = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 };

export function obtenerEscalado(arma, estadistica) {
  const stat = (arma.escalado ?? []).find(s => s.name === estadistica);
  return RANGO_ESCALADO[String(stat?.scaling ?? '').toUpperCase()] ?? 0;
}

export function ordenarPorEscalado(armas, estadistica) {
  return [...armas].sort((a, b) =>
    obtenerEscalado(b, estadistica) - obtenerEscalado(a, estadistica) ||
    a.nombre.localeCompare(b.nombre, 'es')
  );
}

export function resumirObjetos(objetos) {
  const pesos = objetos.map(o => o.peso).filter(n => n !== null);
  const pesoMedio = pesos.length
    ? pesos.reduce((sum, n) => sum + n, 0) / pesos.length
    : null;

  return {
    total: objetos.length,
    pesoMedio,
    porCategoria: objetos.reduce((acc, o) => {
      acc[o.categoria] = (acc[o.categoria] ?? 0) + 1;
      return acc;
    }, {})
  };
}

export function resumirEquipamiento(equipamiento) {
  const piezas = Object.values(equipamiento).filter(Boolean);
  const peso = piezas.reduce((sum, item) => sum + (item.peso ?? 0), 0);
  const sumarStats = clave => {
    const sumas = {};
    piezas.forEach(item => {
      (item[clave] ?? []).forEach(stat => {
        const cantidad = convertirNumero(stat.amount);
        if (cantidad !== null) sumas[stat.name] = (sumas[stat.name] ?? 0) + cantidad;
      });
    });
    return sumas;
  };

  return {
    peso,
    piezas: piezas.length,
    negacionDanio: sumarStats('negacionDanio'),
    resistencia: sumarStats('resistencia')
  };
}

export function comprobarRequisitos(arma, atributos) {
  if (!arma) return { valido: null, faltantes: [] };

  const nombres = {
    Str: 'Fuerza',
    Dex: 'Destreza',
    Int: 'Inteligencia',
    Fai: 'Fe',
    Arc: 'Arcano'
  };
  const faltantes = (arma.requisitos ?? [])
    .map(req => ({
      nombre: nombres[req.name] ?? req.name,
      requerido: convertirNumero(req.amount),
      actual: atributos[req.name] ?? 0
    }))
    .filter(req => req.requerido !== null && req.actual < req.requerido);

  return { valido: faltantes.length === 0, faltantes };
}

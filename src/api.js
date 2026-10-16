const API_URL = 'https://eldenring.fanapis.com/api';
const CACHE_PREFIX = 'eldenring-cache-';
const CACHE_TIME = 1000 * 60 * 60; // 1 hora

export async function obtenerLista(categoria) {
  const todosLosObjetos = [];
  const limite = 100;
  let pagina = 0;
  let hayMas = true;

  while (hayMas) {
    const respuesta = await fetch(
      `${API_URL}/${categoria}?limit=${limite}&page=${pagina}`
    );

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const resultado = await respuesta.json();

    if (!Array.isArray(resultado.data)) {
      throw new Error('La respuesta de la API no es válida');
    }

    todosLosObjetos.push(...resultado.data);

    // Si llegan menos objetos que el límite, hemos llegado al final.
    hayMas = resultado.data.length === limite;
    pagina++;
  }

  return todosLosObjetos;
}
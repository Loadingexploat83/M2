const API_URL = 'https://eldenring.fanapis.com/api';
const CACHE_PREFIX = 'eldenring-cache-';
const CACHE_TIME = 1000 * 60 * 60;

export async function obtenerLista(categoria) {
  const cacheKey = `${CACHE_PREFIX}${categoria}`;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const cache = JSON.parse(raw);
      if (
        Array.isArray(cache.datos) &&
        Number.isFinite(cache.timestamp) &&
        Date.now() - cache.timestamp < CACHE_TIME
      ) {
        return cache.datos;
      }
    }
  } catch (error) {
    console.warn('No se pudo leer la caché:', error);
  }

  const todos = [];
  const limit = 100;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(categoria)}?limit=${limit}&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al cargar ${categoria}`);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('La API devolvió JSON no válido');
    }

    if (!result || !Array.isArray(result.data)) {
      throw new Error('La respuesta de la API no contiene un array data');
    }

    todos.push(...result.data);
    hasMore = result.data.length === limit;
    page += 1;
  }

  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), datos: todos })
    );
  } catch (error) {
    console.warn('No se pudo guardar la caché:', error);
  }

  return todos;
}

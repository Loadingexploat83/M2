export function mostrarObjetos(lista, contenedor, estado, categoria) {
  contenedor.replaceChildren();

  estado.textContent = `${lista.length} resultados`;

  if (lista.length === 0) {
    estado.textContent = 'No hay resultados que coincidan con los filtros.';
    return;
  }

  const fragmento = document.createDocumentFragment();

  lista.forEach(item => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';

    const imagen = document.createElement('img');
    imagen.alt = item.nombre;
    imagen.loading = 'lazy';

    if (item.imagen) {
      imagen.src = item.imagen;
      imagen.onerror = () => {
        imagen.hidden = true;
      };
    } else {
      imagen.hidden = true;
    }

    const nombre = document.createElement('h3');
    nombre.textContent = item.nombre;

    const descripcion = document.createElement('p');
    descripcion.textContent = item.descripcion;

    tarjeta.append(imagen, nombre, descripcion);

    if (item.peso !== null) {
      const peso = document.createElement('p');
      peso.textContent = `Peso: ${item.peso}`;
      tarjeta.append(peso);
    }

    const categoriaTexto = document.createElement('p');
    categoriaTexto.textContent = `Categoría: ${item.categoria}`;
    tarjeta.append(categoriaTexto);

    fragmento.append(tarjeta);
  });

  contenedor.append(fragmento);
}
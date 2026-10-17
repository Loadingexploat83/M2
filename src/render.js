
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

    const original = item.datosOriginales ?? item;

    // Imagen
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

    // Nombre
    const nombre = document.createElement('h3');
    nombre.textContent = item.nombre;

    // Descripción
    const descripcion = document.createElement('p');
    descripcion.textContent = item.descripcion;

    tarjeta.append(imagen, nombre, descripcion);

    // Peso
    if (item.peso !== null) {
      const peso = document.createElement('p');
      peso.textContent = `Peso: ${item.peso}`;
      tarjeta.append(peso);
    }

    // Daños y defensa de armas
    if (categoria === 'weapons') {
      agregarEstadisticas(
        tarjeta,
        'Daño de ataque',
        original.attack
      );

      agregarEstadisticas(
        tarjeta,
        'Defensa del arma',
        original.defence
      );

      agregarEstadisticas(
        tarjeta,
        'Escalado',
        (original.scalesWith ?? []).map(stat => ({
          name: stat.name,
          amount: stat.scaling
        }))
      );

      agregarEstadisticas(
        tarjeta,
        'Requisitos',
        (original.requiredAttributes ?? []).map(stat => ({
          name: stat.name,
          amount: stat.amount
        }))
      );
    }

    // Defensas y resistencias de armaduras
    if (categoria === 'armors') {
      agregarEstadisticas(
        tarjeta,
        'Negación de daño',
        original.dmgNegation
      );

      agregarEstadisticas(
        tarjeta,
        'Resistencias',
        original.resistance
      );
    }

    // Categoría
    if (item.categoria) {
      const categoriaTexto = document.createElement('p');
      categoriaTexto.textContent = `Categoría: ${item.categoria}`;
      tarjeta.append(categoriaTexto);
    }

    fragmento.append(tarjeta);
  });

  contenedor.append(fragmento);
}

function agregarEstadisticas(tarjeta, titulo, datos) {
  if (!Array.isArray(datos) || datos.length === 0) return;

  const seccion = document.createElement('div');
  seccion.className = 'estadisticas';

  const subtitulo = document.createElement('h4');
  subtitulo.textContent = titulo;

  const lista = document.createElement('ul');

  datos.forEach(stat => {
    const elemento = document.createElement('li');
    elemento.textContent = `${stat.name}: ${stat.amount}`;
    lista.append(elemento);
  });

  seccion.append(subtitulo, lista);
  tarjeta.append(seccion);
}

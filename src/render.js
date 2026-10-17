function crear(tag, clase, texto) {
  const elemento = document.createElement(tag);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function mostrarCatalogo(lista, contenedor, categoria, onEquipar) {
  contenedor.replaceChildren();

  if (!lista.length) {
    contenedor.append(crear('p', 'empty-state', 'No hay objetos que coincidan con la búsqueda.'));
    return;
  }

  const fragment = document.createDocumentFragment();

  lista.forEach(item => {
    const card = crear('article', 'item-card');
    if (item.imagen) {
      const img = crear('img', 'item-image');
      img.src = item.imagen;
      img.alt = item.nombre;
      img.loading = 'lazy';
      img.onerror = () => { img.hidden = true; };
      card.append(img);
    }

    const body = crear('div', 'item-card-body');
    body.append(crear('p', 'item-kind', categoria === 'weapons' ? 'ARMA' : 'ARMADURA'));
    body.append(crear('h3', '', item.nombre));
    body.append(crear('p', 'item-description', item.descripcion));
    body.append(crear('p', 'item-weight', `Peso: ${item.peso ?? 'No disponible'}`));

    const stats = categoria === 'weapons' ? item.ataque : item.negacionDanio;
    if (stats.length) {
      const preview = stats.slice(0, 4).map(s => `${s.name} ${s.amount}`).join(' · ');
      body.append(crear('p', 'item-preview', preview));
    }

    const button = crear('button', 'button button-primary', 'Equipar');
    button.type = 'button';
    button.addEventListener('click', () => onEquipar(item));
    body.append(button);
    card.append(body);
    fragment.append(card);
  });

  contenedor.append(fragment);
}

export function mostrarRanuras(equipamiento, contenedor, onQuitar) {
  const ranuras = [
    ['arma', 'Arma'],
    ['head', 'Casco'],
    ['chest', 'Torso'],
    ['arms', 'Guantes'],
    ['legs', 'Grebas']
  ];
  contenedor.replaceChildren();

  ranuras.forEach(([clave, etiqueta]) => {
    const slot = crear('div', 'equipment-slot');
    const info = crear('div', 'slot-info');
    info.append(crear('span', 'slot-label', etiqueta));
    info.append(crear('strong', '', equipamiento[clave]?.nombre ?? 'Vacío'));
    if (equipamiento[clave]) {
      info.append(crear('small', '', `Peso: ${equipamiento[clave].peso ?? 0}`));
    }

    slot.append(info);
    if (equipamiento[clave]) {
      const remove = crear('button', 'button button-small', 'Quitar');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Quitar ${etiqueta}`);
      remove.addEventListener('click', () => onQuitar(clave));
      slot.append(remove);
    }
    contenedor.append(slot);
  });
}

export function mostrarStatsCombinadas(resumen, contenedor) {
  contenedor.replaceChildren();
  const grupos = [
    ['Negación de daño', resumen.negacionDanio],
    ['Resistencias', resumen.resistencia]
  ];

  grupos.forEach(([titulo, stats]) => {
    const section = crear('div', 'combined-group');
    section.append(crear('h3', '', titulo));
    const list = crear('dl', 'stats-list');
    const entries = Object.entries(stats);

    if (!entries.length) {
      section.append(crear('p', 'muted', 'Sin estadísticas disponibles.'));
    } else {
      entries.forEach(([name, amount]) => {
        list.append(crear('dt', '', name));
        list.append(crear('dd', '', amount.toFixed(1)));
      });
      section.append(list);
    }
    contenedor.append(section);
  });
}

export function mostrarBuildsGuardadas(builds, contenedor, { onCargar, onEliminar }) {
  contenedor.replaceChildren();
  if (!builds.length) {
    contenedor.append(crear('p', 'muted', 'Todavía no has guardado ninguna build.'));
    return;
  }

  builds.forEach(build => {
    const row = crear('div', 'saved-build');
    const info = crear('div', 'saved-build-info');
    info.append(crear('strong', '', build.nombre));
    info.append(crear('small', '', new Date(build.actualizada).toLocaleString()));
    const actions = crear('div', 'saved-build-actions');

    const load = crear('button', 'button button-small', 'Cargar');
    load.type = 'button';
    load.addEventListener('click', () => onCargar(build));

    const remove = crear('button', 'button button-small button-danger', 'Eliminar');
    remove.type = 'button';
    remove.addEventListener('click', () => onEliminar(build.id));

    actions.append(load, remove);
    row.append(info, actions);
    contenedor.append(row);
  });
}

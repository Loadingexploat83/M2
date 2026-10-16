import './style.css'

let eldenRingAPI = "https://eldenring.fanapis.com/api"
const ArmorButton = document.querySelector("#ArmorButton")
const ItemButton = document.querySelector("#ItemButton")
const WeaponButton = document.querySelector("#WeaponButton")
const container = document.querySelector("#objectList")
const titulo = document.querySelector("#catalogTitle")
const state = document.querySelector("#state")

ArmorButton.addEventListener('click', ()=>printLista("armors"))
WeaponButton.addEventListener('click', ()=>printLista("weapons"))
ItemButton.addEventListener('click', ()=>printLista("items"))


async function printLista(query){
  titulo.textContent = 
  query === 'armors' ? 'Armaduras' :
  query === 'weapons' ? 'Armas' : 'Objetos';
  container.replaceChildren();
  state.textContent = "Loading..."; 
  const lista = await obtenerLista(query);
  if (lista.length === 0){
    state.textContent = "No se encontro ningun resultado";
    return;
  }

  state.textContent = `${lista.length} resultados`;

  lista.forEach(item => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';

    const nombre = document.createElement('h3');
    nombre.textContent = item.name ?? 'Sin nombre';


    const image = document.createElement('img');
    image.alt = item.name ?? '';
    image.loading = 'lazy';

    if (item.image) {
      image.src = item.image;
    } else {
      image.hidden = true;
    }

    const description = document.createElement('p');
    description.textContent =
      item.description ?? 'Sin descripcion disponible';
    
    tarjeta.append(image, nombre, description);

    if (item.category){
      const category = document.createElement('p');
      category.textContent = item.category;
      tarjeta.append(category);
    }

    container.append(tarjeta);

  });
  console.log(lista);
}

async function obtenerLista(query) {
  try {
    const respuesta = await fetch(`${eldenRingAPI}/${query}?limit=20&page=0`);

    // fetch NO rechaza con errores HTTP (404, 500): hay que comprobar ok
    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
    }

    const result = await respuesta.json(); // parsea el cuerpo JSON
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error("No se pudieron cargar los usuarios:", error.message);
    return [];
  }
}



# M2

M2 · Async Odyssey

## Cómo probarlo
    para probarlo primero debes iniciar el servidor con el comando: npm run dev
    una vez inicias el servidor puedes:
    Abrir el catálogo de armas o armaduras.
    Buscar un elemento y seleccionarlo para equiparlo.
    Comprobar cómo cambian el peso y las estadísticas del personaje.
    Introducir atributos y comprobar los requisitos del arma equipada.
    Guardar las builds que te gusten
    Exportar la configuración e importarla de nuevo para poder compartir tus builds con tus amigos


## Uso de IA
    Se ha utilizado ChatGPT como herramienta de apoyo durante el desarrollo. La IA se empleó para proponer mejoras, ayudar a estructurar módulos, revisar fragmentos de JavaScript y CSS, y orientar la implementación de funcionalidades del constructor.
    Prompts utilizados:
        quiero poder guardar y exportar las builds, ¿como haria esto?

    Las propuestas se revisaron y se probaron en el proyecto ejecutando la aplicación con Vite y comprobando el funcionamiento de sus principales interacciones. Las funciones se verificaron manualmente mediante el catálogo, el equipamiento y las operaciones de guardado y recuperación de builds.

    La revisión también permitió identificar mejoras pendientes, como ampliar la validación de los datos importados y eliminar código que no se utiliza.
    Se revisaron los cambios, se integraron en la estructura del proyecto y se comprobó el comportamiento de la interfaz. También se evaluaron los resultados de la rúbrica para identificar problemas de organización, robustez y documentación.


## Autopsia
1. Guardar las builds y la caché en localStorage

Decidí utilizar localStorage para guardar las builds del usuario y almacenar temporalmente los datos recibidos de la API.

La decisión es discutible porque localStorage tiene una capacidad limitada, funciona únicamente en el navegador del usuario y no permite sincronizar las builds entre dispositivos. Además, si los datos almacenados tienen una estructura incorrecta o antigua, pueden provocar errores al recuperarlos.

Alternativa descartada: utilizar una base de datos y un backend para gestionar las builds. Lo descarté porque habría aumentado la complejidad del proyecto y estaria fuera del alcance de lo que hemos dado en clase.

2. Solicitar las páginas de la API secuencialmente

En src/api.js utilicé async/await dentro de un bucle para solicitar las páginas de la API una tras otra. De esta manera, el código es sencillo de leer, los errores son más fáciles de controlar y no se envían muchas peticiones simultáneamente.

La desventaja es que el tiempo total de carga puede aumentar, ya que cada petición espera a que termine la anterior. Esto puede notarse cuando una categoría contiene muchos elementos.

Alternativa descartada: solicitar varias páginas en paralelo mediante Promise.all() o utilizar concurrencia limitada. Podría reducir el tiempo de carga, pero requiere gestionar mejor los errores, el número de peticiones simultáneas y las posibles limitaciones de la API. Para la versión actual prioricé la simplicidad y la fiabilidad del código.

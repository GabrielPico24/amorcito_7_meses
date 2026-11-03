# 7 meses · Y siempre te elijo

Sitio estático preparado para GitHub Pages. No necesita Node.js, compilación ni servidor. La portada utiliza SortableJS desde un CDN para mejorar el arrastre del puzzle; si la librería no carga, el intercambio de piezas por toques o clics sigue funcionando de forma nativa.

## Publicar en GitHub Pages

1. Sube `index.html`, `styles.css`, `puzzle.js`, `script.js` y la carpeta `assets/` a la raíz del repositorio.
2. En GitHub abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**.
4. Selecciona la rama `main`, la carpeta `/ (root)` y guarda.

GitHub mostrará la URL pública cuando termine el despliegue. Todas las rutas del sitio son relativas, por lo que también funciona cuando el repositorio se publica bajo una dirección como `usuario.github.io/nombre-del-repositorio/`.

## Probar localmente

Puedes abrir `index.html` directamente en el navegador. Para reproducir mejor el comportamiento de GitHub Pages, también puedes iniciar cualquier servidor estático desde esta carpeta.

## Archivos

- `index.html`: contenido y estructura semántica.
- `styles.css`: diseño adaptable, estados y animaciones.
- `puzzle.js`: puzzle de acceso, pista, progreso y desbloqueo de la página principal.
- `script.js`: carta, animaciones de entrada, puente, progreso y deslizador final.
- `assets/photos/`: cinco fotografías optimizadas que cambian gradualmente con el desplazamiento.

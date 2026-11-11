# Trabajo Práctico Módulo #1 — Phaser 3

**Alumno:** Santiago Tornau

Ambas propuestas parten del [Phaser3-Template](https://github.com/UNRaf-PROGRAMACION/Phaser3-Template)
(misma estructura `index.html` / `main.js` / `scenes/` / `public/assets/`, Phaser actualizado a 3.90.0).

## Ejecutar online (GitHub Pages)

- **Página principal (Selector de propuestas):** https://acloshh.github.io/Actividad-2-Phaser-Desarrollo-Tecnol-gico/
- **Propuesta 1 — Lluvia de Figuras:** https://acloshh.github.io/Actividad-2-Phaser-Desarrollo-Tecnol-gico/Propuesta1/
- **Propuesta 2 — Laberinto Estelar:** https://acloshh.github.io/Actividad-2-Phaser-Desarrollo-Tecnol-gico/Propuesta2/

## Cómo ejecutar localmente

Los juegos usan módulos ES, así que hay que servirlos por HTTP (no abrir el `.html` con doble click):

- **VS Code + Live Server**: abrir `index.html`, `Propuesta1/index.html` o `Propuesta2/index.html` → *Open with Live Server*.
- **Python**: `python -m http.server 8000` desde la raíz del proyecto y luego entrar a http://localhost:8000

## Propuesta 1 — Lluvia de Figuras

Imágenes, entradas, colisiones, sonidos y escenas.

| Consigna | Dónde |
|---|---|
| Plataforma inferior con el jugador | `scenes/Juego.js` → `create()` |
| Caen cuadrados, triángulos y rombos al azar | `crearItem()` |
| Recolectados persistidos en un **array** (`this.recolectados`) y verificación de victoria al recolectar | `recolectar()` / `verificarVictoria()` |
| Mejora 1: contador descendente, en 0 se pierde (40 s) | `descontarTiempo()` |
| Mejora 2: puntaje distinto por figura (10/15/20), se gana al **superar 100** | constante `TIPOS` |
| Mejora 3: aparición cada 0.5 s; cada rebote resta 5 al objeto y en 0 desaparece | `alRebotar()` |
| Mejora 4: más plataformas | `create()` |
| Mejora 5: bomba que **resta** puntos | `TIPOS.bomba` |
| Mejora 6: escena única de fin (gana/pierde + puntaje) | `scenes/FinDeJuego.js` |

La condición base de "2 de cada tipo" sigue implementada: cambiar `CONDICION_VICTORIA = "items"` en `Juego.js`.

Controles: ← → / A D para moverse, ↑ / W / Espacio para saltar.

## Propuesta 2 — Laberinto Estelar

Tilemaps y cámaras.

| Consigna | Dónde |
|---|---|
| Laberinto como mapa de mosaicos (Tiled JSON, capas `suelo`, `paredes`, `objetos`) | `public/assets/tilemaps/` + `scenes/Nivel.js` |
| Recolectables + punto de llegada (portal) | capa de objetos `objetos` |
| Ganar: llegar al portal con al menos 5 gemas | `llegarASalida()` |
| Mejora 1: pasa al siguiente mapa llevando el puntaje (y las vidas) | `scene.start("nivel", { nivel, puntaje, vidas })` |
| Mejora 2: nivel 3 de 1952×1280 px, la cámara sigue al jugador + **minimapa** (segunda cámara) | `configurarCamaras()` |
| Mejora 3 (opcional): enemigos que se mueven en horizontal o vertical según el pasillo donde arrancan | `direccionEnemigo()` |

Las paredes colisionan por la propiedad `colisiona` del tileset (`setCollisionByProperty`).

Controles: flechas o WASD.

## Assets

- **Del template**: `space3.png` (fondo), `phaser3-logo.png` (menú), `particles/red.png` (partículas).
- **Figuras, jugador y enemigos**: se dibujan con `Graphics.generateTexture()` en cada `Preload.js`.
- **Sonidos, tileset y mapas**: se generan con `python tools/generar_assets.py`. Los mapas se pueden abrir y editar con [Tiled](https://www.mapeditor.org/). Si se vuelve a correr el script, se sobrescriben.

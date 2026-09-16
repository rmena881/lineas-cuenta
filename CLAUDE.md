# Líneas de cuenta

App estática de un solo fichero para que un equipo comercial (KAM, gestores de cuenta) lleve las líneas de trabajo de cada cuenta desde el móvil. Lo que hace y cómo se comporta está en `SPEC.md`. Los prompts de las siguientes sesiones están en `PROMPTS.md`.

## Reglas que se respetan siempre

1. **Sin dependencias en ejecución.** La app es `index.html` (HTML, CSS y JavaScript en el mismo fichero), `manifest.webmanifest`, `sw.js` y la carpeta `iconos/`. Nada de frameworks, CDN, bundlers ni paso de compilación. Playwright es la única dependencia y solo de desarrollo (`devDependencies`).
2. **Español en todo:** interfaz, mensajes, nombres de variables y funciones, comentarios, commits y documentación.
3. **Caracteres tipográficos prohibidos** en cualquier fichero de texto del proyecto: raya y semirraya (U+2014, U+2013), comillas curvas (U+2018, U+2019, U+201C, U+201D), puntos suspensivos en un solo carácter (U+2026), viñeta (U+2022), flechas (U+2192, U+2190, U+21D2) y emojis. Se usa guion simple, comillas rectas y tres puntos. `test.mjs` lo comprueba.
4. **Sin campos de importe ni documentos.** Ni euros, ni presupuestos, ni adjuntos, ni enlaces a ficheros. La app guarda solo cuenta, título, estado, responsable, hito, origen y notas breves. Así no contiene nada confidencial y puede alojarse en cualquier sitio.
5. **Tema claro y oscuro** siempre funcionales: automático por `prefers-color-scheme` y forzable desde Opciones. Cualquier color nuevo se define como variable en los tres bloques (`:root`, medio oscuro, `data-tema="oscuro"`).
6. **Móvil primero.** Todo tiene que verse y usarse a 390 px de ancho sin desplazamiento horizontal. Botones de al menos 40 px de alto.
7. **Prueba de humo en verde antes de dar por terminado un cambio.** Servidor local en el puerto 8765 y `node test.mjs` sin nada en `errores`. Cada cambio funcional actualiza `SPEC.md` y añade o ajusta un caso en `test.mjs`.
8. **Datos solo en el dispositivo** (`localStorage`, clave `lineas-cuenta.v1`). Si cambia el esquema, se escribe una migración en `normalizarLinea` y sube la versión de la clave. Nunca se pierde lo que el usuario ya tiene.
9. **Al publicar** se sube `VERSION` en `sw.js` y en `index.html` para que el móvil reciba la versión nueva.
10. No se cambia la lista de estados ni el significado de "vencida" sin tocar a la vez `SPEC.md` y `test.mjs`.

## Cómo probar en este equipo

- Python en Windows se llama `python`, no `python3`: `python -m http.server 8765`.
- Smart App Control puede bloquear el Chromium que descarga Playwright. `test.mjs` lo intenta primero y, si falla, usa Edge o Chrome instalados. No hace falta tocar nada.
- Los iconos PNG se regeneran con `python herramientas/generar_iconos.py` (necesita Pillow).

## Estructura

```
index.html            la app completa
manifest.webmanifest  instalable en móvil
sw.js                 caché para uso sin cobertura
iconos/               icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png
test.mjs              prueba de humo con Playwright
herramientas/         scripts solo de desarrollo
SPEC.md               comportamiento de la app
PROMPTS.md            prompts para las siguientes sesiones
```

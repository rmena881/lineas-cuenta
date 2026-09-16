# Prompts para Claude Code

Abre una terminal en esta carpeta y ejecuta `claude`. Claude Code lee `CLAUDE.md` y `SPEC.md` al arrancar. Copia y pega el prompt que toque.

## 1. Desplegar en GitHub Pages (para tenerla en el móvil con URL propia)

Requisitos: `git` y `gh` instalados y `gh auth login` hecho.

```
Este proyecto es una app estática de un solo fichero (index.html) con manifest, service worker e iconos. Quiero publicarla en GitHub Pages para abrirla desde el móvil.

1. Inicializa git si no lo está, crea el repositorio privado "lineas-cuenta" en mi cuenta de GitHub con gh y sube todo a la rama main. No subas node_modules.
2. Activa GitHub Pages sobre la rama main, carpeta raíz, con gh api.
3. Espera a que el despliegue termine y comprueba con curl que index.html responde 200 en la URL de Pages.
4. Devuélveme la URL final y las instrucciones de "Añadir a pantalla de inicio" para iPhone y Android en tres líneas.

No cambies nada del código en este paso.
```

Si Pages no está disponible en un repositorio privado del plan, pide a Claude Code que lo haga público o que despliegue en Netlify Drop o Vercel; la app no tiene nada sensible.

## 2. Comprobar que todo funciona antes de la demo

```
Ejecuta la prueba de humo: instala playwright como dependencia de desarrollo si falta (npm i -D playwright y npx playwright install chromium), lanza un servidor local con python -m http.server 8765 en segundo plano y ejecuta node test.mjs. Enséñame la salida. Si aparece algún error en "errores", corrígelo en index.html sin cambiar el comportamiento descrito en SPEC.md y vuelve a ejecutar la prueba. Para el servidor al terminar.
```

Nota: en este portátil Python se invoca como `python` (no `python3`).

## 3. Ampliaciones para después del jueves (una por sesión)

Alta desde el brief:

```
Añade a index.html una forma de crear varias líneas de golpe a partir de un texto pegado: en el menú de opciones, "Pegar líneas de una reunión". Se abre una hoja con un campo de cuenta, un campo de origen (reunión del día con quién) y un área de texto; cada línea del texto se convierte en una línea de trabajo en estado Detectada, sin fecha ni responsable, y al guardar se abre el tablero filtrado por esa cuenta. Actualiza SPEC.md y añade un caso a test.mjs. Respeta las reglas de CLAUDE.md.
```

Recordatorio del hito:

```
Añade una vista "Hoy": al abrir la app, si hay líneas con hito hoy o vencidas, muestra arriba una franja con el número y un enlace que aplica el filtro de vencidas. Sin notificaciones del sistema todavía. Actualiza SPEC.md y test.mjs.
```

Sincronización entre dispositivos (cuando haya decisión sobre dónde alojar los datos):

```
Propón, sin escribir código todavía, tres opciones para que varios KAM compartan el mismo tablero desde sus móviles: (a) Microsoft Lists en el tenant corporativo con esta app como cliente, (b) un backend mínimo propio, (c) un fichero JSON compartido en OneDrive. Para cada una: qué cambia en index.html, qué hace falta pedir a IT o compliance, esfuerzo estimado en días y riesgo principal. Termina con tu recomendación en cinco líneas.
```

## Reglas que Claude Code debe respetar siempre

Están en `CLAUDE.md`: sin dependencias, español, sin caracteres tipográficos prohibidos, sin campos de importe ni documentos, tema claro y oscuro, prueba de humo en verde antes de dar por terminado un cambio.

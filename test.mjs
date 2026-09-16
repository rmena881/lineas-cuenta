/* Prueba de humo de Líneas de cuenta.
   Requisitos: servidor estático sirviendo la carpeta en BASE_URL (por defecto http://localhost:8765/)
   y Playwright instalado como dependencia de desarrollo (npm i -D playwright; npx playwright install chromium).
   Uso: node test.mjs
   Salida: JSON con "comprobaciones" y "errores". Código de salida 1 si algo falla. */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const RAIZ = dirname(fileURLToPath(import.meta.url));

const comprobaciones = [];
const errores = [];

function comprobar(nombre, condicion, detalle) {
  const ok = !!condicion;
  comprobaciones.push({ nombre, ok, detalle: detalle === undefined ? '' : String(detalle) });
  if (!ok) errores.push('Fallo: ' + nombre + (detalle !== undefined ? ' (' + detalle + ')' : ''));
  return ok;
}

function fechaRelativa(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

async function lanzarNavegador() {
  /* Primero el Chromium de Playwright; si el sistema bloquea binarios no firmados
     (Smart App Control), se usa Edge o Chrome instalados. */
  const intentos = [
    { nombre: 'chromium', opciones: {} },
    { nombre: 'msedge', opciones: { channel: 'msedge' } },
    { nombre: 'chrome', opciones: { channel: 'chrome' } }
  ];
  const fallos = [];
  for (const intento of intentos) {
    try {
      const navegador = await chromium.launch(Object.assign({ headless: true }, intento.opciones));
      return { navegador, motor: intento.nombre };
    } catch (error) {
      fallos.push(intento.nombre + ': ' + String(error.message || error).split('\n')[0]);
    }
  }
  throw new Error('No se pudo lanzar ningún navegador. ' + fallos.join(' | '));
}

const PROHIBIDOS = /[\u2013\u2014\u2018\u2019\u201C\u201D\u2026\u2022\u2192\u2190\u21D2]|\p{Extended_Pictographic}/u;

function revisarCaracteres() {
  const ficheros = readdirSync(RAIZ).filter((f) => /\.(html|js|mjs|md|webmanifest|json)$/.test(f) && f !== 'package-lock.json');
  const hallazgos = [];
  for (const fichero of ficheros) {
    const lineas = readFileSync(join(RAIZ, fichero), 'utf8').split('\n');
    lineas.forEach((linea, i) => {
      if (fichero === 'test.mjs' && linea.includes('PROHIBIDOS')) return;
      const m = linea.match(PROHIBIDOS);
      if (m) hallazgos.push(fichero + ':' + (i + 1) + ' "' + m[0] + '"');
    });
  }
  return { ficheros, hallazgos };
}

async function principal() {
  const { navegador, motor } = await lanzarNavegador();
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES', acceptDownloads: true });
  const pagina = await contexto.newPage();
  const consola = [];
  const fallosRed = [];
  pagina.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
  pagina.on('pageerror', (e) => consola.push('pageerror: ' + e.message));
  pagina.on('requestfailed', (r) => fallosRed.push(r.url() + ' ' + (r.failure() ? r.failure().errorText : '')));
  pagina.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) fallosRed.push(r.url() + ' ' + r.status()); });

  try {
    const respuesta = await pagina.goto(BASE_URL, { waitUntil: 'load' });
    comprobar('index.html responde 200', respuesta && respuesta.status() === 200, respuesta ? respuesta.status() : 'sin respuesta');
    comprobar('Título de la página', (await pagina.title()) === 'Líneas de cuenta', await pagina.title());
    comprobar('Navegador usado', true, motor);

    // Estado limpio
    await pagina.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await pagina.reload({ waitUntil: 'load' });

    // Manifiesto y service worker
    const manifiesto = await pagina.evaluate(async () => {
      const enlace = document.querySelector('link[rel="manifest"]');
      if (!enlace) return null;
      const r = await fetch(enlace.href);
      return { estado: r.status, cuerpo: await r.json() };
    });
    comprobar('Manifiesto enlazado y válido', manifiesto && manifiesto.estado === 200 && manifiesto.cuerpo.name === 'Líneas de cuenta' && manifiesto.cuerpo.icons.length >= 2, manifiesto ? manifiesto.estado : 'sin manifiesto');
    const iconos = await pagina.evaluate(async () => {
      const r = await fetch('iconos/icon-192.png');
      const r2 = await fetch('iconos/icon-512.png');
      return r.status === 200 && r2.status === 200;
    });
    comprobar('Iconos PNG disponibles', iconos);
    const sw = await pagina.evaluate(() => Promise.race([
      navigator.serviceWorker.ready.then((reg) => !!reg.active || !!reg.installing || !!reg.waiting),
      new Promise((resolver) => setTimeout(() => resolver('tiempo agotado'), 8000))
    ]));
    comprobar('Service worker registrado', sw === true, sw);

    // Estado vacío
    comprobar('Estado vacío visible sin datos', await pagina.locator('#vacio').isVisible());

    // Crear primera línea
    await pagina.click('#btn-fab');
    await pagina.waitForSelector('#dlg-linea[open]');
    await pagina.fill('#c-cuenta', 'Cuenta Prueba');
    await pagina.fill('#c-titulo', 'Línea uno de prueba');
    await pagina.selectOption('#c-estado', 'En curso');
    await pagina.fill('#c-resp', 'QA');
    await pagina.fill('#c-hito-fecha', fechaRelativa(5));
    await pagina.fill('#c-hito-texto', 'Hito futuro');
    await pagina.fill('#c-origen', 'Reunión de prueba');
    await pagina.click('#btn-guardar');
    await pagina.waitForSelector('#dlg-linea[open]', { state: 'hidden' });
    comprobar('Crear línea: tarjeta visible', (await pagina.locator('.tarjeta').count()) === 1, await pagina.locator('.tarjeta').count());
    comprobar('Crear línea: agrupada por cuenta', (await pagina.locator('.grupo[data-cuenta="Cuenta Prueba"]').count()) === 1);
    comprobar('Crear línea: estado en la tarjeta', (await pagina.locator('.tarjeta .estado').first().textContent()) === 'En curso');

    // Validación: sin título no se guarda
    await pagina.click('#btn-fab');
    await pagina.waitForSelector('#dlg-linea[open]');
    await pagina.fill('#c-cuenta', 'Cuenta Prueba');
    await pagina.fill('#c-titulo', '   ');
    await pagina.click('#btn-guardar');
    comprobar('Validación: sin título no se guarda', await pagina.locator('#dlg-linea[open]').count() === 1 && (await pagina.locator('.tarjeta').count()) === 1);
    await pagina.click('#btn-cancelar');
    await pagina.waitForSelector('#dlg-linea[open]', { state: 'hidden' });

    // Segunda línea vencida en otra cuenta
    await pagina.click('#btn-fab');
    await pagina.waitForSelector('#dlg-linea[open]');
    await pagina.fill('#c-cuenta', 'Otra Cuenta');
    await pagina.fill('#c-titulo', 'Línea vencida de prueba');
    await pagina.fill('#c-hito-fecha', fechaRelativa(-2));
    await pagina.fill('#c-hito-texto', 'Hito pasado');
    await pagina.click('#btn-guardar');
    await pagina.waitForSelector('#dlg-linea[open]', { state: 'hidden' });
    comprobar('Segunda línea: dos tarjetas y dos grupos', (await pagina.locator('.tarjeta').count()) === 2 && (await pagina.locator('.grupo').count()) === 2);
    comprobar('Línea vencida marcada', (await pagina.locator('.tarjeta.vencida').count()) === 1);
    comprobar('Resumen cuenta pendientes', /1 pendiente de hito/.test(await pagina.locator('#resumen').textContent()), await pagina.locator('#resumen').textContent());

    // Filtro vencidas
    await pagina.check('#f-vencidas');
    comprobar('Filtro vencidas: solo la vencida', (await pagina.locator('.tarjeta').count()) === 1 && (await pagina.locator('.tarjeta.vencida').count()) === 1);
    await pagina.uncheck('#f-vencidas');

    // Filtro por cuenta
    await pagina.selectOption('#f-cuenta', 'Cuenta Prueba');
    comprobar('Filtro por cuenta', (await pagina.locator('.tarjeta').count()) === 1 && (await pagina.locator('.grupo[data-cuenta="Cuenta Prueba"]').count()) === 1);
    comprobar('Botón limpiar filtros visible', await pagina.locator('#btn-limpiar').isVisible());
    await pagina.click('#btn-limpiar');
    comprobar('Limpiar filtros', (await pagina.locator('.tarjeta').count()) === 2);

    // Búsqueda por texto
    await pagina.fill('#f-texto', 'vencida');
    comprobar('Búsqueda por texto', (await pagina.locator('.tarjeta').count()) === 1);
    await pagina.fill('#f-texto', '');

    // Editar: cambiar estado a Ganada y ocultar cerradas
    await pagina.click('.tarjeta.vencida');
    await pagina.waitForSelector('#dlg-linea[open]');
    comprobar('Editar: título de hoja', (await pagina.locator('#dlg-linea-titulo').textContent()) === 'Editar línea');
    await pagina.selectOption('#c-estado', 'Ganada');
    await pagina.click('#btn-guardar');
    await pagina.waitForSelector('#dlg-linea[open]', { state: 'hidden' });
    comprobar('Editar: estado cambiado', (await pagina.locator('.tarjeta .estado[data-estado="Ganada"]').count()) === 1);
    comprobar('Editar: ya no cuenta como vencida', (await pagina.locator('.tarjeta.vencida').count()) === 0);
    await pagina.check('#f-ocultar-cerradas');
    comprobar('Ocultar cerradas', (await pagina.locator('.tarjeta').count()) === 1);
    await pagina.uncheck('#f-ocultar-cerradas');
    const historial = await pagina.evaluate(() => window.LineasCuenta.lineas().find((l) => l.estado === 'Ganada').historial.length);
    comprobar('Historial de estados registrado', historial === 2, historial);

    // Persistencia
    await pagina.reload({ waitUntil: 'load' });
    comprobar('Persistencia tras recargar', (await pagina.locator('.tarjeta').count()) === 2, await pagina.locator('.tarjeta').count());

    // Tema
    await pagina.click('#btn-menu');
    await pagina.waitForSelector('#dlg-menu[open]');
    await pagina.check('input[name="tema"][value="oscuro"]');
    comprobar('Tema oscuro aplicado', (await pagina.evaluate(() => document.documentElement.dataset.tema)) === 'oscuro');
    const fondoOscuro = await pagina.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await pagina.check('input[name="tema"][value="claro"]');
    const fondoClaro = await pagina.evaluate(() => getComputedStyle(document.body).backgroundColor);
    comprobar('Tema claro y oscuro pintan distinto', fondoOscuro !== fondoClaro, fondoOscuro + ' / ' + fondoClaro);
    await pagina.check('input[name="tema"][value="oscuro"]');
    await pagina.click('#btn-cerrar-menu');
    await pagina.reload({ waitUntil: 'load' });
    comprobar('Tema persiste tras recargar', (await pagina.evaluate(() => document.documentElement.dataset.tema)) === 'oscuro');

    // Exportar
    await pagina.click('#btn-menu');
    await pagina.waitForSelector('#dlg-menu[open]');
    const [descarga] = await Promise.all([
      pagina.waitForEvent('download', { timeout: 8000 }),
      pagina.click('#op-exportar')
    ]);
    const rutaDescarga = await descarga.path();
    const exportado = JSON.parse(readFileSync(rutaDescarga, 'utf8'));
    comprobar('Exportar JSON con las líneas', Array.isArray(exportado.lineas) && exportado.lineas.length === 2 && /^lineas-cuenta-\d{4}-\d{2}-\d{2}\.json$/.test(descarga.suggestedFilename()), descarga.suggestedFilename());
    await pagina.click('#btn-cerrar-menu');

    // Eliminar
    pagina.once('dialog', (d) => d.accept());
    await pagina.click('.tarjeta >> nth=0');
    await pagina.waitForSelector('#dlg-linea[open]');
    await pagina.click('#btn-borrar');
    await pagina.waitForSelector('#dlg-linea[open]', { state: 'hidden' });
    comprobar('Eliminar línea', (await pagina.locator('.tarjeta').count()) === 1);

    // Sin scroll horizontal en móvil
    const desborde = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar('Sin desbordamiento horizontal a 390 px', desborde <= 0, desborde);

    // Sin campos de importe ni documentos en la hoja de línea
    const camposProhibidos = await pagina.evaluate(() => {
      const textos = Array.from(document.querySelectorAll('#form-linea label, #form-linea input, #form-linea textarea')).map((e) => (e.textContent + ' ' + (e.placeholder || '') + ' ' + (e.type || '')).toLowerCase());
      return textos.filter((t) => /importe|euros|presupuesto|\bfile\b|adjunt|documento/.test(t) && !/sin importes/.test(t));
    });
    comprobar('Sin campos de importe ni documentos', camposProhibidos.length === 0, camposProhibidos.join(' | '));

    // Caracteres tipográficos prohibidos
    const revision = revisarCaracteres();
    comprobar('Sin caracteres tipográficos prohibidos', revision.hallazgos.length === 0, revision.hallazgos.length ? revision.hallazgos.join('; ') : revision.ficheros.length + ' ficheros revisados');

    // Consola y red
    comprobar('Sin errores de consola', consola.length === 0, consola.join(' | '));
    comprobar('Sin peticiones fallidas', fallosRed.length === 0, fallosRed.join(' | '));
  } catch (error) {
    errores.push('Excepción: ' + (error.stack || error.message || String(error)));
  } finally {
    await contexto.close();
    await navegador.close();
  }
}

principal().catch((error) => errores.push('Excepción: ' + (error.stack || error.message || String(error)))).then(() => {
  const ok = errores.length === 0;
  const resumen = {
    ok,
    url: BASE_URL,
    total: comprobaciones.length,
    superadas: comprobaciones.filter((c) => c.ok).length,
    comprobaciones,
    errores
  };
  console.log(JSON.stringify(resumen, null, 2));
  process.exit(ok ? 0 : 1);
});

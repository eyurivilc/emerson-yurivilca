# Emerson Yurivilca — Landing

Sitio estático en Astro 5 y Tailwind CSS 4. Conserva la identidad oscura y verde, con textos más legibles, iconos SVG locales y degradados/textura CSS estáticos. Sin React, fuentes externas, cookies de analítica ni backend.

## Previsualización local

Requiere Node.js 22 o superior. Desde la carpeta del proyecto:

```sh
npm ci
npm run build
npm run preview
```

Abre `http://127.0.0.1:4321/emerson-yurivilca/`. El servidor se limita a la máquina local. Para editar con recarga automática: `npm run dev`.

**No se han creado commits ni publicado los cambios.** Primero revisa la previsualización.

## Verificación

```sh
npx playwright install chromium firefox webkit
npm run check
npm run format:check
npm run build
npm test
```

Las pruebas cubren tres motores, cinco anchos, contraste automatizado, menú, pestañas, FAQ, formulario sin contactar WhatsApp, enlaces, movimiento reducido y ampliación/reflow. Los informes y capturas se guardan en `reports/` y `playwright-report/` (ignorados por Git).

Para medir rendimiento, mantén la previsualización de producción abierta:

```sh
npm run audit:performance -- final
npm run test:budget
npm run test:performance
```

La comparación requiere una medición previa y su compilación en `reports/baseline/`. `npm run test:baseline` captura el estado que esté servido en ese momento; **no restaura una versión anterior**. No sobrescribas la línea base después de modificar el sitio.

La aceptación de LCP móvil sigue pendiente: +18,6% frente a una tolerancia de 10%; `test:performance` lo informa con código 1. El presupuesto CSS/SVG sí se cumple.

El método, los resultados observados y las limitaciones están en `docs/verification.md`. Las mediciones locales no sustituyen Core Web Vitals de usuarios reales.

## Dónde editar

- `src/pages/index.astro`: contenido, tecnologías, servicios, contacto y demostración.
- `src/styles/global.css`: estilos legibles, tamaños y tratamiento visual estático.
- `src/components/BrandIcon.astro`: redes y WhatsApp como SVG inline tipados.
- `src/components/TechnologyIcon.astro` y `src/assets/icons/`: tecnologías/IA como SVG locales cacheables, con carga diferida y prioridad baja; sin biblioteca de iconos en el cliente.
- `src/components/Icon.astro`: iconos de interfaz existentes.
- `public/emerson-*.webp`: fotografía responsiva.
- `astro.config.mjs`: dominio canónico y ruta base de GitHub Pages.

Los SVG conservan texto visible al lado y se ocultan a lectores de pantalla para no repetir nombres. Power BI conserva sus colores; las tecnologías/IA usan un tono claro fijo y las redes/WhatsApp heredan el color del texto. Procedencia, atribución, cambios y licencias: `public/icon-credits.txt` y `public/licenses/`, también accesibles desde el pie de página. Las licencias de las colecciones no conceden derechos sobre marcas.

## Contenido y alojamiento

Los datos de la demostración son ficticios. El formulario no almacena datos: prepara un mensaje y abre WhatsApp para que la persona decida enviarlo. Se conservan los destinos de contacto originales.

El flujo `.github/workflows/static.yml` despliega en GitHub Pages al recibir un push a `main`; no se ha ejecutado publicación durante esta revisión. `.openai/hosting.json` corresponde al Site de revisión anterior.

**Dependencias pendientes:** la auditoría npm detecta vulnerabilidades en la cadena existente de Astro 5. No se ha aplicado automáticamente una actualización mayor. Revisa `docs/verification.md` antes de ampliar la exposición del servidor o publicar.

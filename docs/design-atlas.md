# Atlas — cuaderno cartográfico

La persona está comprobando una dirección chilena o preparando un lote para exportar a un SIG. Necesita ver el punto y saber si procede de una dirección registrada o de un tramo interpolado. Debe sentirse como una herramienta de cartografía con un cuaderno al lado: útil, sobria y legible.

El usuario rechazó la primera alternativa por parecer una plantilla y autorizó una dirección propia. Esta propuesta se aparta de la referencia Swiss; el diseño original sigue disponible para comparar.

Dominio: ejes viales, numeraciones, anclas, comunas, coordenadas, procedencia y revisión. El color procede de papel de campo, tinta, vegetación de la cartografía, líneas auxiliares y cobre de los hitos: papel #F7F5EE, hoja #FFFEF9, tinta verde #203E36, texto secundario #60706A, retícula #D5DACF y cobre #A4542F. El cobre señala tramos/advertencias; los controles y puntos seleccionados usan tinta verde.

La identidad usa Instrument Serif y los controles IBM Plex Sans. La serif identifica Azimut y los lugares; no domina las etiquetas técnicas. La base de espaciado es 4px, con margen de cuaderno de 24px, controles de 44–46px y líneas sutiles. La profundidad procede de superficies y bordes, sin sombras decorativas.

Firma: un mapa de trabajo ocupa la pantalla, con búsqueda y evidencia en una columna continua. El cuaderno se expresa en la marca de meridiano dibujada en SVG, nombres de lugares en serif, coordenadas monoespaciadas, regla de numeración con posición real y registro de resultados conectado al punto seleccionado. El marcador circular verde queda diferenciado del tramo cobre.

Tres patrones descartados: el hero se elimina de la vista visible; los KPI no se muestran en Atlas; los paneles de igual tamaño se sustituyen por cuaderno lateral y mapa continuo. El registro y la exportación aparecen al consultar. Las fuentes/candidatos usan divulgación progresiva. En móvil el orden es consulta, mapa, evidencia y resultados; las tablas mantienen desplazamiento contenido.

Abre `/azimut/?design=atlas`. Se reutilizan el motor, estado y acciones del panel principal. El diseño 01 sigue en `/azimut/` mediante «Diseño anterior». No hay dos motores ni nuevas dependencias de runtime.

Skills: [frontend-design oficial de Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design), interface-design, laws-of-ux y Ponytail. El origen público y la participación comunitaria son verificables; no se afirma un ranking universal de «mejor skill». OpenSpec registra la alternativa. Las capturas y checks de ambos diseños están referenciados en `docs/verification/ux-review.md`.

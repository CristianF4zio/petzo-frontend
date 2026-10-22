# Prompt para Claude Design — Petzo

Diseña la app móvil **Petzo**: adopción de perros y gatos en Gran Caracas, Venezuela. Cualquier persona o fundación publica mascotas; los adoptantes buscan, solicitan y, si el publicador aprueba, se contactan por WhatsApp. La IA revisa cada publicación contra fraude, así que la **confianza** es la propuesta de valor central.

## Contexto de uso (condiciona todo)
- Android de gama media (frame 360×800 dp), conexión lenta e intermitente. Solo modo claro en el MVP.
- React Native + Expo: nada de efectos que no existan en RN (sin blur/glassmorphism, sin sombras apiladas).
- UI 100% en español de Venezuela, tuteo, cálido y directo ("Publica a tu peludo", no "Crear entidad").

## Dirección visual
Lenguaje de **marketplace cálido y centrado en la foto** (como un marketplace de alojamientos: lienzo blanco, la foto manda, mucho aire, un solo color de marca). Reúsalo como lenguaje visual, no copies ninguna marca.

**Tokens (úsalos tal cual, no inventes valores):**
- Color de marca *Terracota* `#C2410C` (CTA principal, corazón de favorito, links de marca) · pressed `#9A3412` · disabled `#FBD5C5`. Es el único color "de voltaje"; no lo uses decorativamente.
- Confianza: *Verde verificado* `#0F766E` solo para el badge "Fundación verificada" y el estado "revisada".
- Texto: ink `#222222` (nunca negro puro) · body `#3F3F3F` · muted `#6A6A6A`.
- Superficies: canvas `#FFFFFF` · soft `#F7F7F7` · strong `#F2F2F2` · hairline `#DDDDDD`.
- Error de formulario `#B91C1C`. Scrim de modales: negro al 50%.
- Estados de publicación (siempre pastilla con **texto**, el color nunca va solo): Borrador gris `#6A6A6A/#F2F2F2` · En revisión ámbar `#B45309/#FEF3C7` · Publicada verde `#15803D/#DCFCE7` · Rechazada rojo `#B91C1C/#FEE2E2` · Pausada `#3F3F3F/#EBEBEB` · Adoptada terracota `#9A3412/#FFEDD5`.
- Tipografía: **DM Sans**. Títulos de pantalla 22/600, títulos de sección 20/600, título de tarjeta 16/600, cuerpo 16/400 (line-height 1.5), secundario 14/400, caption 13/400, badge 11/600. Nada por encima de 700; la foto aporta el peso visual, no la tipografía.
- Radios: tarjetas y fotos 14 · botones e inputs 8 · chips, pastillas de estado y barra de búsqueda: full. Ninguna esquina viva salvo divisores.
- Espaciado base 4: 4 · 8 · 12 · 16 · 24 · 32 · 48. Márgenes laterales 16, gap entre tarjetas 16, padding interno de tarjeta 16.
- Una sola sombra en todo el sistema (barra de búsqueda y bottom sheets): `0 0 0 1px rgba(0,0,0,.02), 0 2px 6px rgba(0,0,0,.04), 0 4px 8px rgba(0,0,0,.10)`. Todo lo demás plano con hairline.
- Botón primario: terracota, texto blanco 16/500, alto 48, radio 8. Secundario: blanco con borde ink 1px. Terciario: texto ink subrayado.
- Iconos de línea 24 dp, trazo 1.5–2 (estilo Lucide). Sin emojis como iconos.

## Pantallas (todas con estado de carga en skeleton, vacío, error con "Reintentar" y sin conexión)
1. **Bienvenida / Entrar**: foto real de una mascota a sangre, título corto, "Continuar con Google" y "Entrar con correo"; registro con nombre, correo y contraseña. Errores inline.
2. **Completa tu perfil** (obligatorio antes de publicar o solicitar): foto, nombre, **zona** (selector de 11 municipios: Libertador, Chacao, Baruta, Sucre, El Hatillo, Vargas, Los Salias, Carrizal, Guaicaipuro, Plaza, Zamora) y **WhatsApp** con prefijo +58 fijo y máscara `0412 123 4567`. Explica en una línea por qué se pide y que **solo se comparte cuando aprueban una solicitud**.
3. **Catálogo** (pantalla principal): barra pill "Perros · Gatos" arriba; fila horizontal de chips de filtro (Especie, Tamaño, Edad, Sexo, Zona) con contador cuando hay filtros activos; lista de tarjetas a una columna: foto 4:3 con corazón arriba a la derecha y contador de fotos, luego nombre (16/600), "1 año · Macho · Mediano" y zona en muted, badge "Fundación verificada" si aplica. Scroll infinito de 20 en 20 con skeletons. Vacío: "No hay peludos con esos filtros" + "Limpiar filtros".
4. **Filtros** (bottom sheet): segmentos para especie/sexo, chips para tamaño, rango de edad en meses/años, selector de zona; botón "Ver 24 resultados" + "Limpiar".
5. **Detalle de mascota**: carrusel a sangre con indicador "1/5", nombre, fila de datos (edad, sexo, tamaño), chips de salud con icono ("Vacunado", "Esterilizado"; si no, "Sin vacunas" sin alarmismo), descripción, tarjeta del publicador (avatar, nombre, zona, badge verificada o "Particular"), nota con candado: "El WhatsApp se muestra cuando el publicador apruebe tu solicitud". Link discreto "Reportar publicación". CTA fijo abajo: "Quiero adoptarlo/a".
6. **Publicar** (asistente en 4 pasos con progreso): 1) Fotos 1–5: cuadrícula con la primera marcada "Portada", reordenar, quitar, progreso de subida por foto y reintento por foto si falla. 2) Datos: especie, nombre, edad (años + meses), sexo, tamaño, zona (precargada del perfil). 3) Salud y descripción (contador 0/1000). 4) Revisar y enviar, explicando que "Lo revisamos en minutos para evitar fraudes". Muestra el cupo del plan: "Tienes 2 de 3 publicaciones activas". Estado bloqueado cuando se alcanza el límite.
7. **Mis publicaciones**: lista con miniatura, nombre, pastilla de estado y acciones según estado (Editar, Pausar, Reanudar, Marcar como adoptada). Rechazada muestra el motivo en un recuadro y la acción "Editar y reenviar". Avisa que editar una publicada la manda a revisión otra vez.
8. **Perfil**: avatar, nombre, zona, WhatsApp, plan (Gratis: 3 activas / Pro: 30) con pastilla, "Solicitar verificación de fundación", favoritos, cerrar sesión.

También (siguiente sprint, mismo sistema):
9. **Cuestionario de estilo de vida** (vivienda, tiempo en casa, niños, otras mascotas, experiencia) en pasos cortos, y **Recomendados para ti**: tarjetas con "% de compatibilidad" y una razón de una línea.
10. **Solicitud de adopción**: formulario corto + motivación; confirmación.
11. **Solicitudes recibidas** (publicador): por solicitud, resumen IA de 3 líneas + puntaje 0–100 como número grande en ink (no medidores de colores ni estrellas doradas); Aprobar / Rechazar. Al aprobar aparece "Escribir por WhatsApp". Si la IA no respondió: la solicitud se ve igual, sin resumen, con "Resumen no disponible".

## Navegación
Tab bar inferior de 4: Explorar · Publicar · Mis publicaciones · Perfil. Icono + etiqueta siempre visibles; activo en terracota.

## Contenido realista (nada de lorem ipsum)
Nombres: Toby, Luna, Canela, Pelusa, Rocky, Nala. Zonas reales del listado. Fundaciones ficticias: "Refugio Patas del Ávila", "Huellitas de Baruta". Edades: "3 meses", "1 año y 2 meses". Descripciones de 2–3 líneas en tono venezolano natural. Prueba nombres y textos largos para validar cortes y saltos de línea.

## Accesibilidad y calidad
- Contraste AA (4.5:1 en texto normal); objetivos táctiles ≥ 48 dp; todo control con etiqueta visible o accesible.
- El estado nunca se comunica solo con color.
- Rechaza explícitamente: degradados morados/índigo, glassmorphism, sombras pesadas, todo redondeado al máximo, héroes de plantilla, ilustraciones genéricas que tapen las fotos, estrellas doradas, emojis como iconos, padding exagerado que reduzca la densidad del catálogo.

## Entregables
1. Sistema de tokens (color, tipografía, radios, espaciado, sombra) listo para `StyleSheet` de React Native.
2. Componentes: tarjeta de mascota, chip de filtro, pastilla de estado, badge verificada, botón primario/secundario/terciario, input con error, selector de zona, bottom sheet, tab bar, skeleton, estado vacío, estado de error.
3. Las pantallas 1–8 en 360×800 con sus estados; 9–11 si da tiempo.

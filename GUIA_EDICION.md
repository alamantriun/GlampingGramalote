# 🗺️ Mapa de Edición de `index.html`

Esta guía te servirá como un mapa rápido para saber exactamente en qué líneas o secciones buscar dentro de tu archivo `index.html` si quieres cambiar un texto, una imagen o un enlace manualmente en el futuro.

> **💡 Tip:** Si alguna vez usas el buscador de tu editor de código (presionando `Ctrl + F`), solo busca el texto exacto que quieres cambiar tal y como lo lees en la página web y te llevará directo a la línea correcta.

---

### **1. Estilos y Diseño Visual (Líneas 9 - 469)**
*   **Etiqueta:** `<style>`
*   **Qué hay aquí:** Todo el código CSS que le da color, tamaño y animaciones a la página.
*   **Tip:** En las líneas 11 a 24 están los "colores principales" (`:root`), si quieres cambiar el verde oscuro, el crema o el dorado de toda la página, lo modificas ahí.

### **2. Menú de Navegación (Líneas 495 - 507)**
*   **Etiqueta:** `<nav id="nav">`
*   **Qué hay aquí:** La barra superior donde está el logo ("Glamping Culumpulos") y los enlaces que te llevan a las diferentes secciones (Hospedajes, Experiencias, etc.).

### **3. Portada Principal o "Hero" (Líneas 509 - 549)**
*   **Etiqueta:** `<section id="inicio" class="hero">`
*   **Qué hay aquí:** Es lo primero que ve el usuario al entrar (la portada a pantalla completa). 
*   **Cosas que puedes editar:**
    *   El título principal: `"Duerme bajo las estrellas"`.
    *   Los enlaces de los botones principales ("Reservar ahora", "Ver en Instagram").
    *   Los textos de los pequeños carteles emergentes (Popups) de las características de los domos (Confort Premium, Vista Panorámica, Aislamiento).

### **4. Sección "Nosotros" (Líneas 552 - 571)**
*   **Etiqueta:** `<section id="nosotros">`
*   **Qué hay aquí:** El texto que dice "Un rincón mágico en Gramalote" y la descripción principal del lugar.
*   **Cosas que puedes editar:** 
    *   Los párrafos del texto de bienvenida.
    *   Los números de las estadísticas que aparecen en los recuadros debajo (280+ posts, 5.6k seguidores, etc.).

### **5. Hospedajes (Líneas 573 - 659 aprox.)**
*   **Etiqueta:** `<section id="hospedajes" class="hospedajes">`
*   **Qué hay aquí:** Las "tarjetas" con las opciones principales de estadía. 
*   **Cosas que puedes editar:**
    *   Cada opción de hospedaje está dentro de un `<div class="card">`.
    *   Puedes cambiar los nombres: "Domo Glamping", "Zona Camping", "Plan Romántico".
    *   Puedes modificar las etiquetas pequeñas (Cama doble, Vista estrellas) y la descripción de cada plan.
    *   **⚠️ Muy importante:** Aquí están los enlaces de WhatsApp de los botones "Reservar". Si cambias el número o el mensaje predeterminado que envía el usuario al hacer clic, lo haces editando el enlace que empieza con `https://wa.me/...`.

### **6. Experiencias (Líneas 661 - 711 aprox.)**
*   **Etiqueta:** `<section id="experiencias">`
*   **Qué hay aquí:** El "collage" o cuadrícula de imágenes que muestran actividades (Atardeceres únicos, Fogatas, Cuatrimoto).
*   **Cosas que puedes editar:** Los títulos, las imágenes de fondo (`background-image`) y los textos cortos descriptivos de cada experiencia.

### **7. Galería de Fotos (Líneas 713 - 733 aprox.)**
*   **Etiqueta:** `<section id="galeria" class="galeria">`
*   **Qué hay aquí:** La cuadrícula de fotos ("Un vistazo al paraíso").
*   **Cosas que puedes editar:** Las rutas de las imágenes (`src="img/..."`) si alguna vez quieres subir fotos nuevas y reemplazarlas.

### **8. Reservas y Contacto (Líneas 735 - 793 aprox.)**
*   **Etiqueta:** `<section id="reservar" class="reserva">`
*   **Qué hay aquí:** Los botones directos a redes sociales y el formulario principal de contacto.
*   **Cosas que puedes editar:**
    *   Tus números de teléfono y enlaces reales en los grandes botones de contacto ("WhatsApp", "Instagram" y "Llamada directa").
    *   Las opciones del formulario (por ejemplo, si quieres agregar más opciones en el "Número de personas" o el "Tipo de hospedaje").

### **9. Cómo llegar y Pie de página (Líneas 795 en adelante)**
*   **Etiqueta:** `<section id="ubicacion">` y `<footer>`
*   **Qué hay aquí:** La sección donde iría el mapa, un texto descriptivo final, el logo al final del todo y enlaces rápidos (redes sociales).

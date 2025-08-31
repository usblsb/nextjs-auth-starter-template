# Instrucciones para LLM - Generación de Páginas en el Footer

## Propósito

Esta carpeta contiene plantillas y ejemplos para generar páginas consistentes en
la sección `(pages-footer)` del proyecto Next.js 15.

## Archivos de Referencia

### 1. `page-template.tsx`

- **Uso**: Plantilla base para todas las páginas footer
- **Estructura**: Layout completo con Header1, main content y Footer1
- **CSS**: Importa automáticamente `/styles/pages-footer.css`
- **Responsive**: Configurado con Tailwind CSS para todos los dispositivos

### 2. `contenido-template.tsx`

- **Uso**: Plantilla para el contenido JSX de las páginas
- **Elementos**: Incluye h1, h2, h3, párrafos, listas, imágenes
- **Estructura**: Organizado en secciones lógicas
- **Export**: Siempre exportar como `contenidoPagesFooter`

## Proceso de Generación

### Paso 1: Analizar el Tipo de Página

- **Páginas legales** (aviso legal, privacidad, cookies): `noindex, nofollow`
- **Páginas informativas** (contacto, FAQ, requisitos): `noindex, nofollow`
- **Páginas comerciales** (condiciones venta): `noindex, nofollow`

### Paso 2: Crear la Estructura de Archivos

```
web-[nombre-pagina]/
├── page.tsx          # Basado en page-template.tsx
└── contenido.tsx     # Basado en contenido-template.tsx
```

### Paso 3: Personalizar el Contenido

1. **Título**: Usar h1 para el título principal
2. **Secciones**: Organizar con h2 para secciones principales
3. **Subsecciones**: Usar h3 para subsecciones
4. **Listas**: Usar ul/li para enumeraciones
5. **Imágenes**: Colocar en `/public/images/images-pages-footer/`

### Paso 4: Configurar Metadatos

1. Personalizar título y descripción
2. Configurar robots según el tipo de página
3. Incluir OpenGraph para redes sociales

## Convenciones de Nomenclatura

### Carpetas

- Formato: `web-[nombre-descriptivo]`
- Ejemplos: `web-aviso-legal`, `web-politica-privacidad`
- Usar guiones para separar palabras

### Archivos

- `page.tsx`: Componente principal de la página
- `contenido.tsx`: Contenido JSX separado
- Nombres en minúsculas con guiones

### Rutas

- Las carpetas se convierten automáticamente en rutas
- `web-aviso-legal` → `/web-aviso-legal`
- Accesibles desde el navegador

## Elementos HTML Permitidos

### Encabezados

```jsx
<h1>Título Principal</h1>
<h2>Sección</h2>
<h3>Subsección</h3>
<h4>Sub-subsección</h4>
```

### Texto

```jsx
<p>Párrafo normal</p>
<strong>Texto en negrita</strong>
<em>Texto en cursiva</em>
```

### Listas

```jsx
<ul>
  <li>Elemento de lista</li>
</ul>

<ol>
  <li>Lista numerada</li>
</ol>
```

### Imágenes

```jsx
<div className="flex justify-center my-8">
	<figure className="p-6">
		<img
			src="/images/images-pages-footer/imagen.jpg"
			alt="Descripción de la imagen"
			className="max-w-full h-auto rounded"
		/>
	</figure>
</div>
```

### Enlaces

```jsx
<a href="https://ejemplo.com" target="_blank" rel="noopener noreferrer">
	Enlace externo
</a>
```

## Estilos CSS

### Clases Disponibles

El archivo `/styles/pages-footer.css` proporciona estilos para:

- Encabezados (h1, h2, h3, h4)
- Párrafos con espaciado apropiado
- Listas con viñetas personalizadas
- Líneas horizontales
- Espaciado entre elementos

### Responsive Design

- Usar clases de Tailwind CSS
- `max-w-4xl mx-auto` para contenido centrado
- `px-4 sm:px-6 lg:px-8` para padding responsive

## Validaciones

### Antes de Generar

1. ✅ Verificar que el nombre de la carpeta sea único
2. ✅ Confirmar el tipo de página (legal/informativa)
3. ✅ Validar que el contenido sea apropiado
4. ✅ Revisar metadatos según el tipo

### Después de Generar

1. ✅ Verificar que la página se renderice correctamente
2. ✅ Comprobar responsive design
3. ✅ Validar metadatos en el navegador
4. ✅ Confirmar que el CSS se aplique correctamente

## Ejemplos de Uso

### Página Legal

```typescript
// Metadatos con noindex
robots: {
  index: false,
  follow: false,
  noarchive: true,
}
```

### Página Informativa

```typescript
// Metadatos indexables
robots: {
  index: true,
  follow: true,
  noarchive: false,
}
```

## Notas Importantes

1. **Carpeta Privada**: Esta carpeta `_ejemplos` no es accesible públicamente
2. **Consistencia**: Mantener la misma estructura en todas las páginas
3. **SEO**: Configurar robots apropiadamente según el contenido
4. **Accesibilidad**: Usar elementos HTML semánticos
5. **Performance**: Optimizar imágenes antes de subirlas

## Contacto

Para dudas sobre la implementación, consultar la documentación del proyecto
(.trae/rules/project_rules.md) o preguntar al usuario desde el chat.

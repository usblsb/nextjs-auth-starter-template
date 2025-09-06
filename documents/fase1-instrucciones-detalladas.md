# Fase 1: Instrucciones Detalladas - Configuración de Webhooks de Clerk

## 🎯 Objetivo

Configurar webhooks en Clerk Dashboard para sincronizar datos de usuarios y registrar actividad de login/logout.

---

## 📋 Lista de Tareas Paso a Paso

### ✅ **Tarea 1: Acceder al Clerk Dashboard**

**Pasos:**

1. Abre tu navegador web
2. Ve a: [https://dashboard.clerk.com](https://dashboard.clerk.com)
3. Inicia sesión con tu cuenta de Clerk
4. Selecciona tu proyecto/aplicación actual

**Resultado esperado:** Estás en el dashboard principal de tu proyecto

---

### ✅ **Tarea 2: Navegar a la Sección de Webhooks**

**Pasos:**

1. En el menú lateral izquierdo, busca la sección **"Webhooks"**
2. Haz clic en **"Webhooks"**
3. Si no ves la opción, busca en **"Settings"** > **"Webhooks"**

**Resultado esperado:** Estás en la página de configuración de webhooks

---

### ✅ **Tarea 3: Crear Nuevo Webhook Endpoint**

**Pasos:**

1. Haz clic en el botón **"Add Endpoint"** o **"Create Webhook"**
2. En el campo **"Endpoint URL"**, pega exactamente:
   ```
   https://play.svix.com/in/e_y4kk85rGX5C5dFK9nZtVuOdgEXa/
   ```
3. En el campo **"Description"** o **"Name"**, escribe:
   ```
   Svix Play Testing - Sincronización de Usuarios
   ```

**Resultado esperado:** Tienes un nuevo webhook configurado con la URL de Svix Play

---

### ✅ **Tarea 4: Configurar Eventos de Usuario**

**Pasos:**

1. En la sección **"Events"** o **"Event Types"**, busca y selecciona:
   - ☑️ **`user.created`** - Usuario registrado
   - ☑️ **`user.updated`** - Usuario actualizado
   - ☑️ **`user.deleted`** - Usuario eliminado

**Resultado esperado:** Los 3 eventos de usuario están seleccionados

---

### ✅ **Tarea 5: Configurar Eventos de Sesión**

**Pasos:**

1. En la misma sección de eventos, busca y selecciona:
   - ☑️ **`session.created`** - Login de usuario
   - ☑️ **`session.ended`** - Logout de usuario

**Resultado esperado:** Los 2 eventos de sesión están seleccionados

---

### ✅ **Tarea 6: Copiar el Signing Secret**

**Pasos:**

1. Una vez creado el webhook, busca la sección **"Signing Secret"** "whsec_1W8kbTX9FeTJ16/dyWB5A1uUjEzKKAro"
2. Haz clic en **"Reveal"** o el ícono del ojo 👁️
3. **COPIA EL SECRET COMPLETO** (algo como: `whsec_...`)
4. Guárdalo temporalmente en un lugar seguro

**⚠️ IMPORTANTE:** Este secret es necesario para la Fase 2

**Resultado esperado:** Tienes el signing secret copiado y guardado

---

### ✅ **Tarea 7: Activar el Webhook**

**Pasos:**

1. Asegúrate de que el webhook esté marcado como **"Enabled"** o **"Active"**
2. Si hay un toggle/switch, asegúrate de que esté **ON** ✅
3. Haz clic en **"Save"** o **"Create"** para guardar la configuración

**Resultado esperado:** El webhook está activo y guardado

---

### ✅ **Tarea 8: Verificar Funcionamiento**

**Pasos:**

1. Abre una nueva pestaña y ve a:
   ```
   https://play.svix.com/view/e_y4kk85rGX5C5dFK9nZtVuOdgEXa
   ```
2. Deja esta pestaña abierta (aquí verás los eventos)
3. En tu aplicación, registra un usuario de prueba o haz login/logout
4. Regresa a la pestaña de Svix Play y verifica que aparezcan eventos

**Resultado esperado:** Ves eventos JSON llegando a Svix Play cuando interactúas con tu app

---

## 📝 Información a Documentar

Una vez completadas las tareas, tendrás:

- **✅ Webhook URL:** `https://play.svix.com/in/e_y4kk85rGX5C5dFK9nZtVuOdgEXa/`
- **✅ Signing Secret:** `whsec_1W8kbTX9FeTJ16/dyWB5A1uUjEzKKAro`
- **✅ Eventos configurados:**
  - `user.created`, `user.updated`, `user.deleted`
  - `session.created`, `session.ended`
- **✅ Estado:** Webhook activo y funcionando

---

## 🔍 Qué Esperar en Svix Play

Cuando funcione correctamente, verás eventos como:

```json
{
  "type": "user.created",
  "data": {
    "id": "user_...",
    "email_addresses": [...],
    "first_name": "...",
    "last_name": "...",
    "created_at": 1234567890
  }
}
```

---

## ✅ Checklist Final

- [ ] Webhook creado con URL de Svix Play
- [ ] 5 eventos configurados (user._, session._)
- [ ] Signing secret copiado y guardado
- [ ] Webhook activado
- [ ] Eventos aparecen en Svix Play al interactuar con la app

**🎉 Una vez completado, estarás listo para la Fase 2: Implementación de Endpoints API**

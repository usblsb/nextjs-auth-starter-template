### **Reglas de Acceso a Contenido por Tipo de Usuario y Contenido**

#### **Tipos de Contenido**

1. **Contenido Público (OPEN)**

   - Accesible sin registro.
   - Siempre se muestra una versión pública (`contenido_publico`).

2. **Contenido Gratuito (FREE)**

   - Requiere login, pero no suscripción premium.
   - Almacenado en `els_db_lecciones` con `features: ["FREE"]`.

3. **Contenido Premium (PREMIUM)**
   - Requiere login y suscripción premium activa.
   - Almacenado en `els_db_lecciones` con `features: ["PREMIUM"]`.

---

#### **Tipos de Usuario y Acceso**

| Tipo de Usuario                                           | Acceso a Contenido Público                                 | Acceso a Contenido Gratuito (`features: ["FREE"]`)         | Acceso a Contenido Premium (`features: ["PREMIUM"]`)                |
| --------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| **Sin Login**                                             | `contenido_publico` + mensaje: _"Regístrate para ver más"_ | `contenido_publico` + mensaje: _"Regístrate para ver más"_ | `contenido_publico` + mensaje: _"Regístrate para ver más"_          |
| **Clerk Free** (Login, nunca pagó)                        | `contenido_publico` (sin mensaje)                          | `contenido_privado` (acceso completo)                      | `contenido_publico` + mensaje: _"Actualiza a Premium para ver más"_ |
| **Stripe Premium Activo** (Login, pago activo)            | `contenido_publico` (sin mensaje)                          | `contenido_privado` (acceso completo)                      | `contenido_privado` (acceso completo)                               |
| **Stripe Premium Caducado** (Login, pago cancelado/error) | `contenido_publico` (sin mensaje)                          | `contenido_privado` (acceso completo)                      | `contenido_publico` + mensaje: _"Actualiza a Premium para ver más"_ |

---

### **Explicación Detallada**

#### **1. Contenido Público (OPEN)**

- **¿Quién accede?** Todos los usuarios (incluso sin login).
- **¿Qué se muestra?**
  - Siempre `contenido_publico` (versión limitada).
  - **Usuarios sin login:** Reciben el mensaje _"Regístrate para ver más"_.
  - **Usuarios con login (cualquier tipo):** Ven `contenido_publico` sin mensajes adicionales.

#### **2. Contenido Gratuito (FREE)**

- **Requisito:** Login obligatorio.
- **¿Qué se muestra según el usuario?**
  - **Sin login:**
    - `contenido_publico` + mensaje _"Regístrate para ver más"_.
  - **Clerk Free / Stripe Premium (activo o caducado):**
    - `contenido_privado` (acceso completo al contenido).

#### **3. Contenido Premium (PREMIUM)**

- **Requisito:** Login + suscripción premium activa.
- **¿Qué se muestra según el usuario?**
  - **Sin login / Clerk Free / Stripe Premium caducado:**
    - `contenido_publico` + mensaje _"Actualiza a Premium para ver más"_.
  - **Stripe Premium activo:**
    - `contenido_privado` (acceso completo).

---

### **Resumen de Lógica**

- **Usuarios sin login:**

  - Solo ven `contenido_publico` (con mensaje de registro).
  - **Nunca acceden a contenido privado.**

- **Usuarios con login:**

  - **Clerk Free:** Acceden a contenido gratuito completo, pero no a premium.
  - **Stripe Premium activo:** Acceden a todo (gratuito + premium).
  - **Stripe Premium caducado:** Acceden a contenido gratuito, pero no a premium.

- **Mensajes clave:**
  - `"Regístrate para ver más"`: Dirigido a usuarios sin login.
  - `"Actualiza a Premium para ver más"`: Dirigido a usuarios con login sin suscripción premium activa.

### **Notas Técnicas**

- **Base de datos:**
  - Los contenidos **gratuito** y **premium** se identifican en `els_db_lecciones` mediante el campo `features` (valores: `["FREE"]` o `["PREMIUM"]`).
  - El contenido **público** no requiere consulta a esta tabla (se gestiona por separado).
- **Estados de pago:**
  - **Stripe Premium activo:** Suscripción vigente (pago confirmado).
  - **Stripe Premium caducado:** Suscripción cancelada, con error de pago o inactiva.

Esta estructura garantiza claridad en las reglas de acceso y facilita su implementación en el sistema.

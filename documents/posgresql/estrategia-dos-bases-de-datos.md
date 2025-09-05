Quiero separar las bases de datos para evitar conflictos entre SQLAlchemy/Alembic y Prisma. Te explico la estrategia correcta:

## Estrategia de Dos Bases de Datos

**Base de Datos 1 (Python):** `content_db`

- Tablas `els_*` (cursos, lecciones, diapositivas)
- Manejada por SQLAlchemy + Alembic

**Base de Datos 2 (NextJS) esta aplicación :** `users_db`

- Tablas `user_*` (usuarios, suscripciones, pagos)
- Manejada por Prisma
- Integración con Clerk + Stripe

## Implementación para Mostrar Contenido Condicional

### 1. En NextJS - Conexión a Ambas Bases de Datos

```javascript
// lib/databases.js
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

// Conexión a base de datos de contenido (solo lectura)
export const contentDb = new Pool({
	connectionString: process.env.CONTENT_DATABASE_URL,
});

// Prisma para usuarios
export const prisma = new PrismaClient();
```

### 2. API Route para Obtener Lecciones

```javascript
// pages/api/lessons/[courseId].js
import { contentDb, prisma } from "../../../lib/databases";
import { auth } from "@clerk/nextjs";

export default async function handler(req, res) {
	const { userId } = auth();
	const { courseId } = req.query;

	if (!userId) {
		return res.status(401).json({ error: "No autorizado" });
	}

	// 1. Verificar tipo de usuario
	const userSubscription = await prisma.user_subscription.findUnique({
		where: { clerk_user_id: userId },
	});

	const isPaidUser = userSubscription?.status === "active";

	// 2. Obtener lecciones de la base de contenido
	const query = `
    SELECT id, titulo, descripcion, 
           ${isPaidUser ? "contenido_pago" : "contenido_gratis"} as contenido,
           orden
    FROM els_lecciones 
    WHERE curso_id = $1 
    ORDER BY orden
  `;

	const result = await contentDb.query(query, [courseId]);

	res.json({
		lessons: result.rows,
		isPaidUser,
	});
}
```

### 3. Componente en Frontend

```jsx
// components/LessonContent.jsx
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function LessonContent({ courseId }) {
	const { user } = useUser();
	const [lessons, setLessons] = useState([]);
	const [isPaidUser, setIsPaidUser] = useState(false);

	useEffect(() => {
		if (user) {
			fetch(`/api/lessons/${courseId}`)
				.then((res) => res.json())
				.then((data) => {
					setLessons(data.lessons);
					setIsPaidUser(data.isPaidUser);
				});
		}
	}, [user, courseId]);

	return (
		<div>
			{lessons.map((lesson) => (
				<div key={lesson.id} className="lesson">
					<h3>{lesson.titulo}</h3>
					<p>{lesson.descripcion}</p>

					{lesson.contenido ? (
						<div className="content">{lesson.contenido}</div>
					) : (
						<div className="upgrade-prompt">
							<p>Contenido disponible solo para miembros premium</p>
							<button>Actualizar Plan</button>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
```

### 4. Variables de Entorno

```env
# .env.local
CONTENT_DATABASE_URL="postgresql://user:pass@localhost:5432/content_db"
DATABASE_URL="postgresql://user:pass@localhost:5432/users_db"
```

### 5. Schema de Prisma (solo tablas user\_\*)

```prisma
// prisma/schema.prisma
model user_subscription {
  id            String   @id @default(cuid())
  clerk_user_id String   @unique
  stripe_customer_id String?
  status        String   // active, canceled, etc
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
}
```

## Ventajas de Esta Estrategia

1. **Separación total:** No hay conflicto entre herramientas ORM
2. **Seguridad:** Base de contenido puede ser solo lectura desde NextJS
3. **Escalabilidad:** Cada base puede optimizarse independientemente
4. **Mantenimiento:** Cambios en una no afectan la otra

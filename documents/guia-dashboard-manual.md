# Guía para Crear un Dashboard de Perfil de Usuario Personalizado con Clerk

Este documento te guiará para construir una página de perfil de usuario desde cero, aprovechando los hooks y las APIs de Clerk para la lógica de backend.

**Objetivos del Dashboard:**

- Mostrar la foto de perfil del usuario.
- Mostrar el email principal (sin opción de añadir o eliminar otros).
- Permitir al usuario cambiar su contraseña.
- Listar las sesiones activas y permitir cerrarlas.

#### Paso 1: Crear la Estructura de la Página y Obtener los Datos del Usuario

Primero, crea el archivo para tu página de perfil (por ejemplo, `pages/dashboard/profile.js`) y utiliza el hook `useUser` para acceder a la información del usuario que ha iniciado sesión.

```javascript
// pages/dashboard/profile.js
import { useUser } from "@clerk/nextjs";

export default function ProfilePage() {
	const { isLoaded, isSignedIn, user } = useUser();

	// Muestra un loader mientras Clerk carga los datos del usuario
	if (!isLoaded || !isSignedIn) {
		return <div>Cargando...</div>;
	}

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

			<div className="flex items-center space-x-4 mb-8">
				{/* La foto de perfil se obtiene de user.imageUrl */}
				<img
					src={user.imageUrl}
					alt={`Foto de perfil de ${user.fullName}`}
					className="w-24 h-24 rounded-full"
				/>
				<div>
					<h2 className="text-xl font-semibold">{user.fullName}</h2>
					{/* Mostramos el email principal. No añadimos ninguna UI para cambiarlo. */}
					<p className="text-gray-500">
						{user.primaryEmailAddress.emailAddress}
					</p>
				</div>
			</div>

			{/* Aquí añadiremos los demás componentes (cambio de contraseña, sesiones, etc.) */}
		</div>
	);
}
```

#### Paso 2: Implementar el Formulario para Cambiar la Contraseña

Para esta funcionalidad, crearemos un componente separado. Usaremos la función `user.updatePassword()` que nos proporciona el hook `useUser`.

1.  **Crea el componente del formulario:**

    ```javascript
    // components/PasswordChangeForm.js
    import { useState } from "react";
    import { useUser } from "@clerk/nextjs";

    export default function PasswordChangeForm() {
    	const { user } = useUser();
    	const [currentPassword, setCurrentPassword] = useState("");
    	const [newPassword, setNewPassword] = useState("");
    	const [confirmPassword, setConfirmPassword] = useState("");
    	const [message, setMessage] = useState({ type: "", text: "" });

    	const handleChangePassword = async (e) => {
    		e.preventDefault();
    		if (newPassword !== confirmPassword) {
    			setMessage({
    				type: "error",
    				text: "Las nuevas contraseñas no coinciden.",
    			});
    			return;
    		}

    		try {
    			await user.updatePassword({
    				currentPassword,
    				newPassword,
    			});
    			setMessage({
    				type: "success",
    				text: "Contraseña actualizada con éxito.",
    			});
    			// Limpiar los campos
    			setCurrentPassword("");
    			setNewPassword("");
    			setConfirmPassword("");
    		} catch (error) {
    			console.error(error);
    			setMessage({
    				type: "error",
    				text:
    					error.errors[0]?.longMessage ||
    					"Ocurrió un error al cambiar la contraseña.",
    			});
    		}
    	};

    	return (
    		<div className="mt-8 border-t pt-6">
    			<h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
    			<form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
    				{/* Inputs para contraseña actual, nueva y confirmación */}
    				<div>
    					<label>Contraseña Actual</label>
    					<input
    						type="password"
    						value={currentPassword}
    						onChange={(e) => setCurrentPassword(e.target.value)}
    						required
    						className="w-full border p-2 rounded"
    					/>
    				</div>
    				<div>
    					<label>Nueva Contraseña</label>
    					<input
    						type="password"
    						value={newPassword}
    						onChange={(e) => setNewPassword(e.target.value)}
    						required
    						className="w-full border p-2 rounded"
    					/>
    				</div>
    				<div>
    					<label>Confirmar Nueva Contraseña</label>
    					<input
    						type="password"
    						value={confirmPassword}
    						onChange={(e) => setConfirmPassword(e.target.value)}
    						required
    						className="w-full border p-2 rounded"
    					/>
    				</div>

    				<button
    					type="submit"
    					className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    				>
    					Actualizar Contraseña
    				</button>

    				{message.text && (
    					<p
    						className={
    							message.type === "error" ? "text-red-500" : "text-green-500"
    						}
    					>
    						{message.text}
    					</p>
    				)}
    			</form>
    		</div>
    	);
    }
    ```

#### Paso 3: Mostrar las Sesiones Activas

Para listar las conexiones activas, usaremos el hook `useSessionList`. Este hook nos da acceso a todas las sesiones del usuario y nos permite revocarlas.

1.  **Crea el componente para listar sesiones:**

    ```javascript
    // components/ActiveSessions.js
    import { useSessionList } from "@clerk/nextjs";

    export default function ActiveSessions() {
    	const { isLoaded, sessionList, setActive } = useSessionList();

    	if (!isLoaded) {
    		return <div>Cargando sesiones...</div>;
    	}

    	const handleRevoke = async (sessionId) => {
    		const sessionToRevoke = sessionList.find((s) => s.id === sessionId);
    		if (sessionToRevoke) {
    			try {
    				await sessionToRevoke.revoke();
    				// La lista se actualiza automáticamente gracias al hook
    			} catch (error) {
    				console.error("Error al revocar la sesión", error);
    			}
    		}
    	};

    	return (
    		<div className="mt-8 border-t pt-6">
    			<h3 className="text-lg font-semibold mb-4">Sesiones Activas</h3>
    			<div className="space-y-4">
    				{sessionList.map((session) => (
    					<div
    						key={session.id}
    						className="flex justify-between items-center p-3 border rounded"
    					>
    						<div>
    							<p className="font-medium">
    								{session.isCurrent ? "Esta sesión" : "Otra sesión"}
    							</p>
    							<p className="text-sm text-gray-500">
    								{session.latestActivity.toString()} - {session.ipAddress}
    							</p>
    						</div>
    						{!session.isCurrent && (
    							<button
    								onClick={() => handleRevoke(session.id)}
    								className="text-red-500 hover:underline"
    							>
    								Cerrar sesión
    							</button>
    						)}
    					</div>
    				))}
    			</div>
    		</div>
    	);
    }
    ```

#### Paso 4: Integrar Todo en la Página de Perfil

Ahora, importa y utiliza los componentes que creaste en tu página `ProfilePage`.

```javascript
// pages/dashboard/profile.js (versión final)
import { useUser } from "@clerk/nextjs";
import PasswordChangeForm from "../../components/PasswordChangeForm"; // Ajusta la ruta si es necesario
import ActiveSessions from "../../components/ActiveSessions"; // Ajusta la ruta si es necesario

export default function ProfilePage() {
	const { isLoaded, isSignedIn, user } = useUser();

	if (!isLoaded || !isSignedIn) {
		return <div>Cargando...</div>;
	}

	return (
		<div className="p-4 md:p-8 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

			{/* Sección de Información del Usuario */}
			<div className="flex items-center space-x-4 mb-8">
				<img
					src={user.imageUrl}
					alt={`Foto de perfil de ${user.fullName}`}
					className="w-24 h-24 rounded-full"
				/>
				<div>
					<h2 className="text-xl font-semibold">
						{user.fullName || "Usuario"}
					</h2>
					<p className="text-gray-500">
						{user.primaryEmailAddress.emailAddress}
					</p>
				</div>
			</div>

			{/* Componente para cambiar la contraseña */}
			<PasswordChangeForm />

			{/* Componente para mostrar sesiones activas */}
			<ActiveSessions />
		</div>
	);
}
```

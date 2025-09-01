'use client';

import { UserProfile } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

interface UserProfileWrapperProps {
	appearance?: any;
}

export default function UserProfileWrapper({ appearance }: UserProfileWrapperProps) {
	const { isLoaded, isSignedIn, user } = useUser();

	// Mostrar loading mientras se carga la información del usuario
	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-3 text-gray-600">Cargando perfil...</span>
			</div>
		);
	}

	// Si no está autenticado, mostrar mensaje
	if (!isSignedIn || !user) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Acceso no autorizado
					</h2>
					<p className="text-gray-600">
						Debes iniciar sesión para acceder a esta página.
					</p>
				</div>
			</div>
		);
	}

	// Renderizar UserProfile solo cuando el usuario está completamente cargado y autenticado
	// Combinar la configuración de appearance con restricciones de seguridad
	const secureAppearance = {
		...appearance,
		elements: {
			...appearance?.elements,
			// Ocultar la sección de números de teléfono también por seguridad
			profileSection__phoneNumbers: {
				display: 'none',
			},
		},
	};

	return (
		<UserProfile
			appearance={secureAppearance}
		/>
	);
}
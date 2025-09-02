"use client";

import { useState } from "react";
import Image from "next/image";

interface ProfileSectionProps {
	user: any; // Usando any por compatibilidad con useUser
	onError?: (error: string) => void;
	onLoading?: (loading: boolean) => void;
	className?: string;
}

export default function ProfileSection({
	user,
	onError,
	onLoading,
	className = "",
}: ProfileSectionProps) {
	const [imageError, setImageError] = useState(false);

	// Función para formatear fechas
	const formatDate = (date: Date | string | null) => {
		if (!date) return "No disponible";

		try {
			const dateObj = typeof date === "string" ? new Date(date) : date;
			return dateObj.toLocaleDateString("es-ES", {
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			return "Fecha inválida";
		}
	};

	// Obtener datos del usuario
	const profileData = {
		avatar: user?.imageUrl,
		fullName:
			user?.fullName ||
			`${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
			"Usuario",
		email:
			user?.primaryEmailAddress?.emailAddress ||
			user?.emailAddresses?.[0]?.emailAddress ||
			"No disponible",
		userId: user?.id || "No disponible",
		createdAt: user?.createdAt,
		lastSignInAt: user?.lastSignInAt,
	};

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Información básica del usuario */}
			<div className="bg-gray-50 rounded-lg p-6">
				<div className="flex items-center space-x-6">
					{/* Avatar del usuario */}
					<div className="flex-shrink-0">
						{profileData.avatar && !imageError ? (
							<div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200">
								<Image
									src={profileData.avatar}
									alt={`Avatar de ${profileData.fullName}`}
									fill
									sizes="80px"
									className="object-cover"
									onError={() => setImageError(true)}
								/>
							</div>
						) : (
							<div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
								<svg
									className="w-10 h-10 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>
						)}
					</div>

					{/* Información del usuario */}
					<div className="flex-1 min-w-0">
						<h2 className="text-2xl font-bold text-gray-900 truncate">
							{profileData.fullName}
						</h2>
						<p className="text-lg text-gray-600 truncate">
							{profileData.email}
						</p>
						<p className="text-sm text-gray-500 mt-1">
							ID: {profileData.userId}
						</p>
					</div>
				</div>
			</div>

			{/* Detalles de la cuenta */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Información de registro */}
				<div className="bg-white border border-gray-200 rounded-lg p-4">
					<div className="flex items-center mb-3">
						<svg
							className="w-5 h-5 text-green-600 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h3 className="text-lg font-medium text-gray-900">
							Fecha de Registro
						</h3>
					</div>
					<p className="text-gray-600">{formatDate(profileData.createdAt)}</p>
				</div>

				{/* Último acceso */}
				<div className="bg-white border border-gray-200 rounded-lg p-4">
					<div className="flex items-center mb-3">
						<svg
							className="w-5 h-5 text-blue-600 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h3 className="text-lg font-medium text-gray-900">Último Acceso</h3>
					</div>
					<p className="text-gray-600">
						{formatDate(profileData.lastSignInAt)}
					</p>
				</div>
			</div>

			{/* Información adicional */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start">
					<svg
						className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div>
						<h4 className="text-sm font-medium text-blue-900 mb-1">
							Información del Perfil
						</h4>
						<p className="text-sm text-blue-800">
							Esta información se obtiene directamente de tu cuenta de Clerk.
							Para modificar tu nombre o email, utiliza las opciones de
							configuración de seguridad.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

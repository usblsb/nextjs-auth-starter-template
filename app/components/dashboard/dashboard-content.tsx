"use client";

import { useState } from "react";
import ProfileSection from "./sections/profile-section";
import SecuritySection from "./sections/security-section";
import BillingSection from "@/app/components/dashboard/sections/billing-section";

type DashboardSection = "profile" | "security" | "billing";

interface DashboardContentProps {
	activeSection: DashboardSection;
	user: any; // Usando any por ahora para compatibilidad con useUser
	isLoading?: boolean;
	onError?: (error: string) => void;
	onLoading?: (loading: boolean) => void;
	className?: string;
}

export default function DashboardContent({
	activeSection,
	user,
	isLoading = false,
	onError,
	onLoading,
	className = "",
}: DashboardContentProps) {
	// Función helper para manejar errores
	const handleError = (error: string) => {
		if (onError) {
			onError(error);
		}
	};

	// Función helper para manejar estados de carga
	const handleLoading = (loading: boolean) => {
		if (onLoading) {
			onLoading(loading);
		}
	};

	return (
		<div
			className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
		>
			{/* Header de la sección activa */}
			<div className="px-6 py-4 border-b border-gray-200">
				<h1 className="text-2xl font-semibold text-gray-900">
					{activeSection === "profile"
						? "Mi Perfil"
						: activeSection === "security"
						? "Configuración de Seguridad"
						: "Facturación y Suscripción"}
				</h1>
				<p className="mt-1 text-sm text-gray-600">
					{activeSection === "profile"
						? "Gestiona tu información personal y preferencias de cuenta"
						: activeSection === "security"
						? "Administra tu contraseña y sesiones activas"
						: "Gestiona tu suscripción, métodos de pago y acceso a contenido premium"}
				</p>
			</div>

			{/* Contenido de la sección */}
			<div className="p-6">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
						<span className="ml-3 text-gray-600">Cargando...</span>
					</div>
				) : (
					<>
						{activeSection === "profile" && (
							<ProfileSection
								user={user}
								onError={handleError}
								onLoading={handleLoading}
							/>
						)}

						{activeSection === "security" && (
							<SecuritySection
								user={user}
								onError={handleError}
								onLoading={handleLoading}
							/>
						)}

						{activeSection === "billing" && (
							<BillingSection
								user={user}
								onError={handleError}
								onLoading={handleLoading}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}

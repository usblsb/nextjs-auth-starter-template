"use client";

import ProfileSection from "./sections/profile-section";
import SecuritySection from "./sections/security-section";
import BillingSection from "@/app/components/dashboard/sections/billing-section";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardSection = "profile" | "security" | "billing" | "demo";

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

	const getSectionInfo = () => {
		switch (activeSection) {
			case "profile":
				return {
					title: "Mi Perfil",
					description: "Gestiona tu información personal y preferencias de cuenta"
				};
			case "security":
				return {
					title: "Configuración de Seguridad",
					description: "Administra tu contraseña y sesiones activas"
				};
			case "billing":
				return {
					title: "Facturación y Suscripción",
					description: "Gestiona tu suscripción, métodos de pago y acceso a contenido premium"
				};
			default:
				return { title: "", description: "" };
		}
	};

	const sectionInfo = getSectionInfo();

	return (
		<Card className={`w-full ${className}`}>
			<CardHeader>
				<CardTitle className="text-xl lg:text-2xl">{sectionInfo.title}</CardTitle>
				<CardDescription className="text-sm">
					{sectionInfo.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-[250px]" />
							<Skeleton className="h-4 w-[200px]" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
						<Skeleton className="h-[100px] w-full" />
					</div>
				) : (
					<div className="w-full">
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
					</div>
				)}
			</CardContent>
		</Card>
	);
}

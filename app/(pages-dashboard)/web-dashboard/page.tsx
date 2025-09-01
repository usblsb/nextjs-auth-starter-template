import { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Header from "../../components/layouts/header";
import { Footer } from "../../_template/components/footer";

export async function generateMetadata(): Promise<Metadata> {
	const title = "Dashboard - Administrar Cuenta | Electrónica School";
	const description =
		"Administra tu perfil, configuración de seguridad y datos de cuenta en Electrónica School.";

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "website",
		},
		robots: {
			index: false,
			follow: false,
			noarchive: true,
			nocache: true,
			nosnippet: true,
			noimageindex: true,
			notranslate: true,
		},
	};
}

export default async function WebDashboardPage() {
	// Protección de ruta - Solo usuarios autenticados pueden acceder
	await auth.protect();

	return (
		<>
			<div className="flex flex-col min-h-screen">
				<Header />
				<main className="flex-1 bg-gray-50">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						<div className="lg:grid lg:grid-cols-12 lg:gap-8">
							<div className="lg:col-span-12">
								<div className="max-w-4xl mx-auto">
									{/* Contenedor del componente UserProfile */}
									<UserProfile
							appearance={{
											elements: {
												// Personalización del contenedor principal
												rootBox: "w-full",
												card: "shadow-none border-0 bg-transparent",
												// Personalización de la navegación
												navbar: "border-b border-gray-200 mb-6",
												navbarButton:
													"text-gray-600 hover:text-blue-600 font-medium",
												navbarButtonActive:
													"text-blue-600 border-b-2 border-blue-600",
												// Personalización de formularios
												formButtonPrimary:
													"bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200",
												formFieldInput:
													"border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
												formFieldLabel: "text-gray-700 font-medium",
												// Personalización de la página principal
												page: "bg-transparent",
												pageScrollBox: "bg-transparent",
											},
											variables: {
												// Variables de color personalizadas
												colorPrimary: "#2563eb", // blue-600
												colorBackground: "#ffffff",
												colorText: "#374151", // gray-700
												colorTextSecondary: "#6b7280", // gray-500
												borderRadius: "0.375rem", // rounded-md
											},
										}}
										path="/web-dashboard"
										routing="path"
									/>
								</div>
							</div>
						</div>
					</div>
				</main>
				<Footer />
			</div>
		</>
	);
}

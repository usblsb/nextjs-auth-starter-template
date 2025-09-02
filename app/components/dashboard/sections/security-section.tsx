"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

import PasswordChangeForm from "./password-change-form";
import ActiveSessions from "./active-sessions";

interface SecuritySectionProps {
	user?: any;
	onError?: (error: string) => void;
	onLoading?: (loading: boolean) => void;
	className?: string;
}

export default function SecuritySection({
	user: propUser,
	onError,
	onLoading,
	className = ""
}: SecuritySectionProps = {}) {
	const { user: hookUser, isLoaded } = useUser();
	const user = propUser || hookUser;
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"password" | "sessions">(
		"password"
	);
	const [lastPasswordChange, setLastPasswordChange] = useState<Date | null>(
		null
	);
	const [securityScore, setSecurityScore] = useState<number>(0);

	// Calcular puntuación de seguridad
	const calculateSecurityScore = useCallback(() => {
		let score = 0;

		// Verificar si tiene contraseña configurada
		if (user?.passwordEnabled) score += 30;

		// Verificar autenticación de dos factores
		if (user?.twoFactorEnabled) score += 40;

		// Verificar email verificado
		if (user?.primaryEmailAddress?.verification?.status === "verified")
			score += 20;

		// Verificar cambio reciente de contraseña (últimos 90 días)
		if (lastPasswordChange) {
			const daysSinceChange = Math.floor(
				(Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
			);
			if (daysSinceChange <= 90) score += 10;
		}

		return Math.min(score, 100);
	}, [user, lastPasswordChange]);

	// Actualizar puntuación de seguridad cuando cambie el usuario
	useEffect(() => {
		if (isLoaded && user) {
			setSecurityScore(calculateSecurityScore());
		}
	}, [isLoaded, user, calculateSecurityScore]);

	// Función para manejar errores
	const handleError = useCallback((errorMessage: string) => {
		setError(errorMessage);
		setSuccess(null);
		if (onError) onError(errorMessage);

		// Limpiar error después de 5 segundos
		setTimeout(() => {
			setError(null);
		}, 5000);
	}, [onError]);

	// Función para manejar éxito
	const handleSuccess = useCallback((successMessage: string) => {
		setSuccess(successMessage);
		setError(null);

		// Actualizar fecha de último cambio de contraseña
		if (successMessage.includes("contraseña")) {
			setLastPasswordChange(new Date());
		}

		// Limpiar éxito después de 5 segundos
		setTimeout(() => {
			setSuccess(null);
		}, 5000);
	}, []);

	// Función para manejar estado de carga
	const handleLoading = useCallback((loading: boolean) => {
		setIsLoading(loading);
		if (onLoading) onLoading(loading);
	}, [onLoading]);

	// Función para obtener el color de la puntuación de seguridad
	const getSecurityScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600 bg-green-100";
		if (score >= 60) return "text-yellow-600 bg-yellow-100";
		if (score >= 40) return "text-orange-600 bg-orange-100";
		return "text-red-600 bg-red-100";
	};

	// Función para obtener el texto de la puntuación de seguridad
	const getSecurityScoreText = (score: number) => {
		if (score >= 80) return "Excelente";
		if (score >= 60) return "Buena";
		if (score >= 40) return "Regular";
		return "Necesita mejoras";
	};

	// Función para obtener recomendaciones de seguridad
	const getSecurityRecommendations = () => {
		const recommendations = [];

		if (!user?.passwordEnabled) {
			recommendations.push({
				icon: "🔐",
				title: "Configurar contraseña",
				description: "Añade una contraseña para mayor seguridad",
				priority: "high",
			});
		}

		if (!user?.twoFactorEnabled) {
			recommendations.push({
				icon: "🛡️",
				title: "Activar autenticación de dos factores",
				description: "Añade una capa extra de seguridad a tu cuenta",
				priority: "high",
			});
		}

		if (user?.primaryEmailAddress?.verification?.status !== "verified") {
			recommendations.push({
				icon: "📧",
				title: "Verificar email",
				description: "Verifica tu dirección de email principal",
				priority: "medium",
			});
		}

		if (lastPasswordChange) {
			const daysSinceChange = Math.floor(
				(Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
			);
			if (daysSinceChange > 90) {
				recommendations.push({
					icon: "🔄",
					title: "Cambiar contraseña",
					description: "Considera cambiar tu contraseña regularmente",
					priority: "low",
				});
			}
		}

		return recommendations;
	};

	if (!isLoaded) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="space-y-4">
							<div className="h-6 bg-gray-200 rounded w-1/4"></div>
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2"></div>
							<div className="h-4 bg-gray-200 rounded w-2/3"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const recommendations = getSecurityRecommendations();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Seguridad</h2>
					<p className="text-gray-600">
						Gestiona la seguridad de tu cuenta y controla el acceso a tus datos.
					</p>
				</div>
				<div className="text-right">
					<div
						className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSecurityScoreColor(
							securityScore
						)}`}
					>
						<svg
							className="w-4 h-4 mr-2"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clipRule="evenodd"
							/>
						</svg>
						{securityScore}% - {getSecurityScoreText(securityScore)}
					</div>
					<p className="text-xs text-gray-500 mt-1">Puntuación de seguridad</p>
				</div>
			</div>

			{/* Recomendaciones de seguridad */}
			{recommendations.length > 0 && (
				<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
					<div className="flex items-start">
						<svg
							className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clipRule="evenodd"
							/>
						</svg>
						<div className="flex-1">
							<h4 className="text-sm font-semibold text-blue-800 mb-2">
								💡 Recomendaciones de seguridad
							</h4>
							<div className="space-y-2">
								{recommendations.slice(0, 3).map((rec, index) => (
									<div
										key={index}
										className="flex items-start text-sm text-blue-700"
									>
										<span className="mr-2">{rec.icon}</span>
										<div>
											<span className="font-medium">{rec.title}:</span>
											<span className="ml-1">{rec.description}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Navegación por pestañas */}
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-8">
					<button
						onClick={() => setActiveTab("password")}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === "password"
								? "border-blue-500 text-blue-600"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						<div className="flex items-center">
							<svg
								className="w-4 h-4 mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							Contraseña
						</div>
					</button>
					<button
						onClick={() => setActiveTab("sessions")}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === "sessions"
								? "border-blue-500 text-blue-600"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						<div className="flex items-center">
							<svg
								className="w-4 h-4 mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							Sesiones Activas
						</div>
					</button>
				</nav>
			</div>

			{/* Mensajes de estado globales */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex">
						<svg
							className="w-5 h-5 text-red-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
						<div className="ml-3">
							<p className="text-sm text-red-800">{error}</p>
						</div>
					</div>
				</div>
			)}

			{success && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex">
						<svg
							className="w-5 h-5 text-green-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clipRule="evenodd"
							/>
						</svg>
						<div className="ml-3">
							<p className="text-sm text-green-800">{success}</p>
						</div>
					</div>
				</div>
			)}

			{/* Contenido de las pestañas */}
			<div className="mt-6">
				{activeTab === "password" && (
					<div className="space-y-6">
						<PasswordChangeForm
							user={user}
							onError={handleError}
							onSuccess={handleSuccess}
							onLoading={handleLoading}
						/>

						{/* Información adicional sobre contraseñas */}
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
							<div className="flex items-start">
								<svg
									className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clipRule="evenodd"
									/>
								</svg>
								<div>
									<h4 className="text-sm font-semibold text-gray-800 mb-2">
										🔐 Consejos para contraseñas seguras
									</h4>
									<ul className="text-sm text-gray-600 space-y-1">
										<li className="flex items-start">
											<span className="text-gray-400 mr-2">•</span>
											<span>
												Usa al menos 12 caracteres con mayúsculas, minúsculas,
												números y símbolos
											</span>
										</li>
										<li className="flex items-start">
											<span className="text-gray-400 mr-2">•</span>
											<span>
												Evita información personal como nombres, fechas de
												nacimiento o direcciones
											</span>
										</li>
										<li className="flex items-start">
											<span className="text-gray-400 mr-2">•</span>
											<span>
												No reutilices contraseñas de otras cuentas importantes
											</span>
										</li>
										<li className="flex items-start">
											<span className="text-gray-400 mr-2">•</span>
											<span>
												Considera usar un gestor de contraseñas para generar y
												almacenar contraseñas únicas
											</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === "sessions" && (
					<ActiveSessions
						user={user}
						onError={handleError}
						onLoading={handleLoading}
					/>
				)}
			</div>

			{/* Información de seguridad */}
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div className="flex items-start">
					<svg
						className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
					<div>
						<h4 className="text-sm font-medium text-yellow-900 mb-1">
							Consejos de Seguridad
						</h4>
						<ul className="text-sm text-yellow-800 space-y-1">
							<li>• Usa una contraseña única y fuerte</li>
							<li>• Revisa regularmente tus sesiones activas</li>
							<li>• Cierra sesión en dispositivos que no reconozcas</li>
							<li>• No compartas tu contraseña con nadie</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}

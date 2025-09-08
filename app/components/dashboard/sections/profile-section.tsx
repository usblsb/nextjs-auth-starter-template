"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProfileSectionProps {
	user: any; // Usuario de Clerk (solo email)
	onError?: (error: string) => void;
	onLoading?: (loading: boolean) => void;
	className?: string;
}

interface StripeCustomerData {
	name?: string;
	address?: {
		line1?: string;
		line2?: string;
		city?: string;
		state?: string;
		postal_code?: string;
		country?: string;
	};
	hasSubscription: boolean;
}

export default function ProfileSection({
	user,
	onError,
	onLoading,
	className = "",
}: ProfileSectionProps) {
	const [imageError, setImageError] = useState(false);
	const [stripeData, setStripeData] = useState<StripeCustomerData | null>(null);
	const [loadingStripeData, setLoadingStripeData] = useState(true);
	const [creatingPortalSession, setCreatingPortalSession] = useState(false);

	// Cargar datos de Stripe al montar el componente
	useEffect(() => {
		if (user?.id) {
			fetchStripeCustomerData();
		}
	}, [user?.id]);

	const fetchStripeCustomerData = async () => {
		try {
			setLoadingStripeData(true);
			const response = await fetch('/api/stripe/subscription-status');
			
			if (response.ok) {
				const data = await response.json();
				
				// Si tiene suscripción, obtener datos del customer de Stripe
				if (data.subscription && data.subscription.isSubscribed) {
					const customerResponse = await fetch('/api/user/billing-address');
					if (customerResponse.ok) {
						const customerData = await customerResponse.json();
						setStripeData({
							name: customerData.name || null,
							address: customerData.address || null,
							hasSubscription: true,
						});
					} else {
						setStripeData({ hasSubscription: true });
					}
				} else {
					setStripeData({ hasSubscription: false });
				}
			}
		} catch (error) {
			console.error('Error fetching Stripe customer data:', error);
			setStripeData({ hasSubscription: false });
		} finally {
			setLoadingStripeData(false);
		}
	};

	const openStripePortal = async () => {
		if (!stripeData?.hasSubscription) return;
		
		try {
			setCreatingPortalSession(true);
			const response = await fetch('/api/stripe/create-portal-session', {
				method: 'POST',
			});

			if (response.ok) {
				const { url } = await response.json();
				window.open(url, '_blank');
			} else {
				onError?.('Error al abrir el portal de cliente');
			}
		} catch (error) {
			console.error('Error creating portal session:', error);
			onError?.('Error al abrir el portal de cliente');
		} finally {
			setCreatingPortalSession(false);
		}
	};

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

	// Formatear dirección
	const formatAddress = (address: StripeCustomerData['address']) => {
		if (!address) return "No disponible";
		
		const parts = [];
		if (address.line1) parts.push(address.line1);
		if (address.line2) parts.push(address.line2);
		if (address.city) parts.push(address.city);
		if (address.state) parts.push(address.state);
		if (address.postal_code) parts.push(address.postal_code);
		if (address.country) parts.push(address.country);
		
		return parts.length > 0 ? parts.join(', ') : "No disponible";
	};

	// Obtener datos del usuario (email de Clerk + datos de Stripe)
	const profileData = {
		avatar: user?.imageUrl,
		// Email siempre de Clerk (fijo)
		email: user?.primaryEmailAddress?.emailAddress || 
			   user?.emailAddresses?.[0]?.emailAddress || 
			   "No disponible",
		// Nombre de Stripe o fallback básico
		fullName: stripeData?.name || "Usuario",
		userId: user?.id || "No disponible",
		createdAt: user?.createdAt,
		lastSignInAt: user?.lastSignInAt,
		address: stripeData?.address,
		hasStripeData: stripeData?.hasSubscription || false,
	};

	if (loadingStripeData) {
		return (
			<div className={`space-y-6 ${className}`}>
				<div className="bg-gray-50 rounded-lg p-6 animate-pulse">
					<div className="flex items-center space-x-6">
						<div className="w-20 h-20 rounded-full bg-gray-300"></div>
						<div className="flex-1">
							<div className="h-6 bg-gray-300 rounded mb-2"></div>
							<div className="h-4 bg-gray-300 rounded mb-1"></div>
							<div className="h-3 bg-gray-300 rounded w-1/2"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

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

					{/* Botón portal Stripe - solo si tiene suscripción */}
					{profileData.hasStripeData && (
						<div className="flex-shrink-0">
							<button
								onClick={openStripePortal}
								disabled={creatingPortalSession}
								className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
							>
								{creatingPortalSession ? 'Abriendo...' : 'Modificar Datos'}
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Detalles del perfil */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Información de facturación */}
				{profileData.hasStripeData ? (
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
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							<h3 className="text-lg font-medium text-gray-900">
								Dirección de Facturación
							</h3>
						</div>
						<p className="text-gray-600 text-sm">
							{formatAddress(profileData.address)}
						</p>
					</div>
				) : (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<div className="flex items-center mb-3">
							<svg
								className="w-5 h-5 text-yellow-600 mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.662-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
							<h3 className="text-lg font-medium text-yellow-900">
								Datos de Facturación
							</h3>
						</div>
						<p className="text-yellow-800 text-sm">
							Los datos de facturación se completarán automáticamente cuando realices tu primera suscripción.
						</p>
					</div>
				)}

				{/* Fecha de registro */}
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
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<h3 className="text-lg font-medium text-gray-900">
							Fecha de Registro
						</h3>
					</div>
					<p className="text-gray-600">{formatDate(profileData.createdAt)}</p>
				</div>
			</div>

			{/* Información del sistema */}
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
							• El email proviene de tu cuenta y no se puede modificar.<br/>
							• Los datos de facturación (nombre, dirección) provienen de Stripe.<br/>
							• Para modificar tus datos de facturación, usa el botón &quot;Modificar Datos&quot; que te llevará al portal de cliente de Stripe.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
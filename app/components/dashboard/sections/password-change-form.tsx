"use client";

import { useState, useEffect } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PasswordChangeFormProps {
	user: any;
	onError?: (error: string) => void;
	onLoading?: (loading: boolean) => void;
	onPasswordChanged?: () => void;
	onSuccess?: (message: string) => void;
	className?: string;
}

interface PasswordFormState {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
	isSubmitting: boolean;
	error: string | null;
	success: boolean;
}

export default function PasswordChangeForm({
	user,
	onError,
	onLoading,
	onPasswordChanged,
	onSuccess,
	className = "",
}: PasswordChangeFormProps) {
	const { user: clerkUser } = useUser();

	const [formState, setFormState] = useState<PasswordFormState>({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
		isSubmitting: false,
		error: null,
		success: false,
	});

	const [showPasswords, setShowPasswords] = useState({
		current: false,
		new: false,
		confirm: false,
	});

	// Función mejorada para validar la fortaleza de la contraseña
	const validatePasswordStrength = (password: string) => {
		const minLength = password.length >= 8;
		const maxLength = password.length <= 128;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumbers = /\d/.test(password);
		const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
			password
		);
		const noCommonPatterns =
			!/^(password|123456|qwerty|abc123|admin|letmein)$/i.test(password);
		const noRepeatingChars = !/(..).*\1/.test(password); // No más de 2 caracteres repetidos consecutivos

		const criteria = [
			minLength,
			hasUpperCase,
			hasLowerCase,
			hasNumbers,
			hasSpecialChar,
			noCommonPatterns,
			noRepeatingChars,
		];
		const score = criteria.filter(Boolean).length;

		let strength = "Muy débil";
		let strengthColor = "text-red-600";
		let strengthBg = "bg-red-200";

		if (score >= 6) {
			strength = "Muy fuerte";
			strengthColor = "text-green-600";
			strengthBg = "bg-green-200";
		} else if (score >= 5) {
			strength = "Fuerte";
			strengthColor = "text-blue-600";
			strengthBg = "bg-blue-200";
		} else if (score >= 4) {
			strength = "Moderada";
			strengthColor = "text-yellow-600";
			strengthBg = "bg-yellow-200";
		} else if (score >= 2) {
			strength = "Débil";
			strengthColor = "text-orange-600";
			strengthBg = "bg-orange-200";
		}

		return {
			score,
			maxScore: 7,
			isValid: score >= 5 && maxLength,
			strength,
			strengthColor,
			strengthBg,
			feedback: {
				minLength,
				maxLength,
				hasUpperCase,
				hasLowerCase,
				hasNumbers,
				hasSpecialChar,
				noCommonPatterns,
				noRepeatingChars,
			},
		};
	};

	// Calcular fortaleza de contraseña
	const passwordStrength = validatePasswordStrength(formState.newPassword);

	// Función para cambiar contraseña con reverificación
	const updatePasswordWithReverification = async () => {
		if (!user) {
			throw new Error("Usuario no disponible");
		}

		return await user.updatePassword({
			currentPassword: formState.currentPassword,
			newPassword: formState.newPassword,
			signOutOfOtherSessions: true, // Cerrar otras sesiones por seguridad
		});
	};

	// Hook de reverificación para manejar verificación adicional
	const updatePasswordAction = useReverification(
		updatePasswordWithReverification
	);

	// Función mejorada para manejar el envío del formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Limpiar errores previos
		setFormState((prev) => ({ ...prev, error: null }));

		// Validaciones mejoradas
		if (!formState.currentPassword.trim()) {
			setFormState((prev) => ({
				...prev,
				error: "La contraseña actual es requerida",
			}));
			return;
		}

		if (!formState.newPassword.trim()) {
			setFormState((prev) => ({
				...prev,
				error: "La nueva contraseña es requerida",
			}));
			return;
		}

		if (formState.newPassword !== formState.confirmPassword) {
			setFormState((prev) => ({
				...prev,
				error: "Las contraseñas no coinciden",
			}));
			return;
		}

		const passwordValidation = validatePasswordStrength(formState.newPassword);
		if (!passwordValidation.isValid) {
			setFormState((prev) => ({
				...prev,
				error:
					"La nueva contraseña no cumple con los requisitos de seguridad mínimos",
			}));
			return;
		}

		if (formState.currentPassword === formState.newPassword) {
			setFormState((prev) => ({
				...prev,
				error: "La nueva contraseña debe ser diferente a la actual",
			}));
			return;
		}

		setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));
		if (onLoading) onLoading(true);

		try {
			// Usar la acción con reverificación
			await updatePasswordAction();

			// Éxito
			setFormState({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
				isSubmitting: false,
				error: null,
				success: true,
			});

			if (onPasswordChanged) onPasswordChanged();
			if (onSuccess) onSuccess("Contraseña cambiada exitosamente");

			// Limpiar mensaje de éxito después de 5 segundos
			setTimeout(() => {
				setFormState((prev) => ({ ...prev, success: false }));
			}, 5000);
		} catch (error: any) {
			let errorMessage =
				"Error al cambiar la contraseña. Por favor, intenta de nuevo.";

			// Manejo específico de errores de Clerk
			if (error?.errors && error.errors.length > 0) {
				const clerkError = error.errors[0];
				switch (clerkError.code) {
					case "form_password_incorrect":
						errorMessage = "La contraseña actual es incorrecta";
						break;
					case "form_password_pwned":
						errorMessage =
							"Esta contraseña ha sido comprometida en filtraciones de datos. Elige una diferente";
						break;
					case "form_password_too_common":
						errorMessage = "Esta contraseña es muy común. Elige una más segura";
						break;
					case "form_password_length_too_short":
						errorMessage = "La contraseña debe tener al menos 8 caracteres";
						break;
					default:
						errorMessage =
							clerkError.longMessage || clerkError.message || errorMessage;
				}
			}

			setFormState((prev) => ({
				...prev,
				error: errorMessage,
				isSubmitting: false,
			}));
			if (onError) onError(errorMessage);
		} finally {
			if (onLoading) onLoading(false);
		}
	};

	// Función para alternar visibilidad de contraseñas
	const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
		setShowPasswords((prev) => ({
			...prev,
			[field]: !prev[field],
		}));
	};

	return (
		<Card className={`max-w-md ${className}`}>
			<CardHeader>
				<CardTitle>Cambiar Contraseña</CardTitle>
				<CardDescription>
					Actualiza tu contraseña para mantener tu cuenta segura
				</CardDescription>
			</CardHeader>
			<CardContent>
			{/* Mensaje de éxito */}
			{formState.success && (
				<Alert className="mb-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
					<CheckCircle className="h-4 w-4" />
					<AlertDescription>
						¡Contraseña cambiada exitosamente!
					</AlertDescription>
				</Alert>
			)}

			{/* Mensaje de error */}
			{formState.error && (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{formState.error}</AlertDescription>
				</Alert>
			)}

			{/* Formulario */}
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Contraseña actual */}
				<div className="space-y-2">
					<Label htmlFor="currentPassword">
						Contraseña Actual
					</Label>
					<div className="relative">
						<Input
							type={showPasswords.current ? "text" : "password"}
							id="currentPassword"
							value={formState.currentPassword}
							onChange={(e) =>
								setFormState((prev) => ({
									...prev,
									currentPassword: e.target.value,
									error: null,
								}))
							}
							placeholder="Ingresa tu contraseña actual"
							disabled={formState.isSubmitting}
							required
							className="pr-10"
						/>
						{/* Indicador mejorado de fortaleza de contraseña */}
						{formState.newPassword && (
							<div className="mt-3">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium text-gray-700">
										Fortaleza de contraseña:
									</span>
									<span
										className={`text-sm font-semibold px-2 py-1 rounded-full ${passwordStrength.strengthBg} ${passwordStrength.strengthColor}`}
									>
										{passwordStrength.strength}
									</span>
								</div>

								{/* Barra de progreso mejorada */}
								<div className="w-full bg-gray-200 rounded-full h-3 mb-3">
									<div
										className={`h-3 rounded-full transition-all duration-500 ease-out ${
											passwordStrength.score >= 6
												? "bg-gradient-to-r from-green-400 to-green-600"
												: passwordStrength.score >= 5
												? "bg-gradient-to-r from-blue-400 to-blue-600"
												: passwordStrength.score >= 4
												? "bg-gradient-to-r from-yellow-400 to-yellow-600"
												: passwordStrength.score >= 2
												? "bg-gradient-to-r from-orange-400 to-orange-600"
												: "bg-gradient-to-r from-red-400 to-red-600"
										}`}
										style={{
											width: `${
												(passwordStrength.score / passwordStrength.maxScore) *
												100
											}%`,
										}}
									></div>
								</div>

								{/* Lista mejorada de requisitos */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.minLength
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.minLength
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										Mínimo 8 caracteres
									</div>

									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.maxLength
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.maxLength
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										Máximo 128 caracteres
									</div>

									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.hasUpperCase
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.hasUpperCase
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										Una mayúscula (A-Z)
									</div>

									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.hasLowerCase
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.hasLowerCase
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										Una minúscula (a-z)
									</div>

									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.hasNumbers
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.hasNumbers
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										Un número (0-9)
									</div>

									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.hasSpecialChar
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.hasSpecialChar
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										Un carácter especial (!@#$%...)
									</div>

									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.noCommonPatterns
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.noCommonPatterns
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										No usar patrones comunes
									</div>

									<div
										className={`flex items-center transition-colors duration-200 ${
											passwordStrength.feedback.noRepeatingChars
												? "text-green-600"
												: "text-red-500"
										}`}
									>
										<svg
											className="w-4 h-4 mr-2 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d={
													passwordStrength.feedback.noRepeatingChars
														? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												}
												clipRule="evenodd"
											/>
										</svg>
										Sin repeticiones excesivas
									</div>
								</div>
							</div>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
							onClick={() => togglePasswordVisibility("current")}
						>
							{showPasswords.current ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>

				{/* Nueva contraseña */}
				<div className="space-y-2">
					<Label htmlFor="newPassword">
						Nueva Contraseña
					</Label>
					<div className="relative">
						<Input
							type={showPasswords.new ? "text" : "password"}
							id="newPassword"
							value={formState.newPassword}
							onChange={(e) =>
								setFormState((prev) => ({
									...prev,
									newPassword: e.target.value,
									error: null,
								}))
							}
							placeholder="Ingresa tu nueva contraseña"
							disabled={formState.isSubmitting}
							required
							className="pr-10"
						/>
						<button
							type="button"
							className="absolute inset-y-0 right-0 pr-3 flex items-center"
							onClick={() => togglePasswordVisibility("new")}
						>
							{showPasswords.new ? (
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
									/>
								</svg>
							) : (
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>

				{/* Confirmar contraseña */}
				<div className="space-y-2">
					<Label htmlFor="confirmPassword">
						Confirmar Nueva Contraseña
					</Label>
					<div className="relative">
						<Input
							type={showPasswords.confirm ? "text" : "password"}
							id="confirmPassword"
							value={formState.confirmPassword}
							onChange={(e) =>
								setFormState((prev) => ({
									...prev,
									confirmPassword: e.target.value,
									error: null,
								}))
							}
							placeholder="Confirma tu nueva contraseña"
							disabled={formState.isSubmitting}
							required
							className="pr-10"
						/>
						<button
							type="button"
							className="absolute inset-y-0 right-0 pr-3 flex items-center"
							onClick={() => togglePasswordVisibility("confirm")}
						>
							{showPasswords.confirm ? (
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
									/>
								</svg>
							) : (
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>

				{/* Botón de envío */}
				<div className="pt-4">
					<Button
						type="submit"
						disabled={formState.isSubmitting}
						className="w-full"
					>
						{formState.isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Cambiando contraseña...
							</>
						) : (
							"Cambiar Contraseña"
						)}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
	);
}

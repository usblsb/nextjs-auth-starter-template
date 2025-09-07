"use client";

import { useState } from "react";

type DashboardSection = "profile" | "security" | "billing";

interface DashboardSidebarProps {
	activeSection: DashboardSection;
	onSectionChange: (section: DashboardSection) => void;
	className?: string;
}

interface MenuItem {
	id: DashboardSection;
	label: string;
	description: string;
	icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
	{
		id: "profile",
		label: "Perfil",
		description: "Información personal",
		icon: (
			<svg
				className="w-5 h-5"
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
		),
	},
	{
		id: "security",
		label: "Seguridad",
		description: "Contraseña y sesiones",
		icon: (
			<svg
				className="w-5 h-5"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
				/>
			</svg>
		),
	},
	{
		id: "billing",
		label: "Facturación",
		description: "Suscripción y pagos",
		icon: (
			<svg
				className="w-5 h-5"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
				/>
			</svg>
		),
	},
];

export default function DashboardSidebar({
	activeSection,
	onSectionChange,
	className = "",
}: DashboardSidebarProps) {
	return (
		<nav
			className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}
		>
			<div className="text-xs text-gray-500 text-center">Menú Dashboard</div>
			<div className="mt-6 pt-4 border-t border-gray-200"></div>

			<div className="space-y-2">
				{menuItems.map((item) => {
					const isActive = activeSection === item.id;

					return (
						<button
							key={item.id}
							onClick={() => onSectionChange(item.id)}
							className={`
                w-full flex items-center px-3 py-3 text-left rounded-md transition-colors duration-200
                ${
									isActive
										? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
										: "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
								}
              `}
						>
							<div
								className={`flex-shrink-0 mr-3 ${
									isActive ? "text-blue-600" : "text-gray-400"
								}`}
							>
								{item.icon}
							</div>
							<div className="flex-1 min-w-0">
								<p
									className={`text-sm font-medium ${
										isActive ? "text-blue-700" : "text-gray-900"
									}`}
								>
									{item.label}
								</p>
								<p
									className={`text-xs ${
										isActive ? "text-blue-600" : "text-gray-500"
									}`}
								>
									{item.description}
								</p>
							</div>
							{isActive && (
								<div className="flex-shrink-0 ml-2">
									<div className="w-2 h-2 bg-blue-600 rounded-full"></div>
								</div>
							)}
						</button>
					);
				})}
			</div>

			{/* Información adicional más botones */}
		</nav>
	);
}

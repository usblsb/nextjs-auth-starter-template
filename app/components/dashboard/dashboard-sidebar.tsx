"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Shield, CreditCard } from 'lucide-react';

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
		icon: <User className="h-4 w-4" />,
	},
	{
		id: "security",
		label: "Seguridad",
		description: "Contraseña y sesiones",
		icon: <Shield className="h-4 w-4" />,
	},
	{
		id: "billing",
		label: "Facturación",
		description: "Suscripción y pagos",
		icon: <CreditCard className="h-4 w-4" />,
	},
];

export default function DashboardSidebar({
	activeSection,
	onSectionChange,
	className = "",
}: DashboardSidebarProps) {
	return (
		<Card className={`w-full ${className}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm text-muted-foreground text-center">
					Menú Dashboard
				</CardTitle>
			</CardHeader>
			<Separator />
			<CardContent className="p-0">
				{/* Mobile: Tabs horizontal */}
				<div className="lg:hidden">
					<Tabs value={activeSection} onValueChange={(value) => onSectionChange(value as DashboardSection)}>
						<TabsList className="grid w-full grid-cols-3 m-4" role="tablist" aria-label="Dashboard sections">
							{menuItems.map((item) => (
								<TabsTrigger 
									key={item.id} 
									value={item.id}
									className="flex flex-col gap-1 h-auto py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									role="tab"
									aria-controls={`${item.id}-panel`}
									aria-selected={activeSection === item.id}
								>
									<span aria-hidden="true">{item.icon}</span>
									<span className="text-xs">{item.label}</span>
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>

				{/* Desktop: Lista vertical */}
				<div className="hidden lg:block p-4 space-y-1" role="tablist" aria-label="Dashboard sections">
					{menuItems.map((item) => {
						const isActive = activeSection === item.id;
						return (
							<button
								key={item.id}
								onClick={() => onSectionChange(item.id)}
								className={`
									w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all duration-200
									focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
									${isActive 
										? 'bg-primary/10 text-primary border-l-2 border-primary' 
										: 'text-muted-foreground hover:text-foreground hover:bg-accent'
									}
								`}
								role="tab"
								aria-controls={`${item.id}-panel`}
								aria-selected={isActive}
								tabIndex={isActive ? 0 : -1}
							>
								<div className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true">
									{item.icon}
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm">{item.label}</div>
									<div className="text-xs text-muted-foreground">{item.description}</div>
								</div>
								{isActive && (
									<Badge variant="secondary" className="ml-auto">
										•
									</Badge>
								)}
							</button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

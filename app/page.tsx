import { Metadata } from "next";

import Header from "./components/layouts/header";
import Footer from "./components/layouts/footer";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
	const title = "Academia de Electrónica | Electrónica School";
	const description =
		"Los mejores cursos técnicos necesarios para aprender Electrónica online.";

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "website",
		},
		robots: {
			index: true,
			follow: true,
			noarchive: true,
			nocache: true,
			nosnippet: false,
			noimageindex: false,
			notranslate: true,
		},
	};
}

export default function Home() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<Header />
				<main className="flex-1">
					{/* Sección centrada con H1 y entrada */}
					<section className="py-12 px-4">
						<div className="max-w-4xl mx-auto text-center space-y-6">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
								Aprende Electrónica de Forma Práctica
							</h1>
							<div className="max-w-md mx-auto">
								<Input 
									type="email" 
									placeholder="Introduce tu email para comenzar" 
									className="w-full"
								/>
							</div>
						</div>
					</section>

					{/* Sección con grid responsivo */}
					<section className="py-12 px-4 bg-gray-50 dark:bg-gray-900">
						<div className="max-w-7xl mx-auto">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<Card>
									<CardHeader>
										<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
											<div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
										</div>
										<CardTitle>Título de Característica</CardTitle>
										<CardDescription>
											Describe brevemente cómo esta característica resuelve un problema específico del usuario.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
											<div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
										</div>
										<CardTitle>Título de Característica</CardTitle>
										<CardDescription>
											Describe brevemente cómo esta característica resuelve un problema específico del usuario.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
											<div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
										</div>
										<CardTitle>Título de Característica</CardTitle>
										<CardDescription>
											Describe brevemente cómo esta característica resuelve un problema específico del usuario.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
											<div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
										</div>
										<CardTitle>Título de Característica</CardTitle>
										<CardDescription>
											Describe brevemente cómo esta característica resuelve un problema específico del usuario.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
											<div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
										</div>
										<CardTitle>Título de Característica</CardTitle>
										<CardDescription>
											Describe brevemente cómo esta característica resuelve un problema específico del usuario.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
											<div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
										</div>
										<CardTitle>Título de Característica</CardTitle>
										<CardDescription>
											Describe brevemente cómo esta característica resuelve un problema específico del usuario.
										</CardDescription>
									</CardHeader>
								</Card>
							</div>
						</div>
					</section>
				</main>
				<Footer />
			</div>
		</>
	);
}

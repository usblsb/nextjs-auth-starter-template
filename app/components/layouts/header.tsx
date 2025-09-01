"use client";

import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";

export default function Header() {
	const { isSignedIn, user } = useUser();
	const { signOut } = useAuth();

	return (
		<header className="border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
				<Link href="/" className="flex items-center">
					<span className="ml-2 text-xl font-semibold text-blue-600">
						ELECTRÓNICA SCHOOL
					</span>
				</Link>
				
				<div className="flex items-center space-x-4">
					{isSignedIn ? (
						<>
							<span className="text-sm text-gray-600">
								Hola, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
							</span>
							<button
								onClick={() => signOut()}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
							>
								Cerrar Sesión
							</button>
						</>
					) : (
						<Link
							href="/sign-in"
							className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
						>
							Iniciar Sesión
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}

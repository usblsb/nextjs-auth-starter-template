import { SignOutButton } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignOutButton>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Cerrar Sesión
        </button>
      </SignOutButton>
    </div>
  );
}
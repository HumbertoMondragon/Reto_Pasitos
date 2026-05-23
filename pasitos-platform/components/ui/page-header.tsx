import Link from "next/link";
import { Shield } from "lucide-react";

interface PageHeaderProps {
  userName?: string;
  userEmail?: string;
}

export function PageHeader({ userName, userEmail }: PageHeaderProps) {
  return (
    <header className="bg-blue-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-300" />
          <div>
            <p className="font-bold text-sm leading-tight">Pasitos</p>
            <p className="text-xs text-blue-300 leading-tight">Education &amp; Health A.C.</p>
          </div>
        </Link>
        {userName ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{userName}</p>
              {userEmail && <p className="text-xs text-blue-300">{userEmail}</p>}
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-sm font-bold">
              {userName[0].toUpperCase()}
            </div>
          </div>
        ) : (
          <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
}

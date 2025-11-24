import Link from "next/link";
import { MessageSquare, Megaphone, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          ChatAdmin
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/channels"
            className="p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Canais</h2>
            </div>
            <p className="text-gray-600">
              Gerenciar canais de chat, membros e configurações
            </p>
          </Link>

          <Link
            href="/announcements"
            className="p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Avisos</h2>
            </div>
            <p className="text-gray-600">
              Criar e gerenciar avisos do feed de atividades
            </p>
          </Link>

          <Link
            href="/users"
            className="p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Usuários</h2>
            </div>
            <p className="text-gray-600">
              Gerenciar usuários e permissões por tema
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { MessageSquare, Megaphone, Users, Tag } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-5xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          ChatAdmin
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/channels"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Canais</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Gerenciar canais de chat e membros
            </p>
          </Link>

          <Link
            href="/announcements"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Avisos</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Criar e gerenciar avisos do feed
            </p>
          </Link>

          <Link
            href="/users"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Usuários</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Gerenciar usuários e permissões
            </p>
          </Link>

          <Link
            href="/temas"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Temas</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Gerenciar temas e segmentação
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

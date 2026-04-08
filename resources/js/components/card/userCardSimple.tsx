import React from 'react';
import Barcode from 'react-barcode';
import { Eye, MessageCircle, Edit3, Settings, GraduationCap, BookOpen, MapPin } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface UserCardProps {
  user: {
    id: number | string;
    name?: string;
    barcode?: string;
    email?: string;
    phone?: string;
    department?: {
      id: number;
      name: string;
      barcode?: string;
    } | string;
    role?: string;
    avatar?: string;
    [key: string]: any;
  };
  className?: string;
}

export default function UserCardSimple({ user, className = '' }: UserCardProps) {
  const page = usePage<any>();
  const currentUser = page.props?.auth?.user ?? page.props?.user;
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role || '';

  const dept = typeof user.department === 'object' && user.department?.name
    ? user.department.name
    : (typeof user.department === 'string' ? user.department : 'Brak działu');

  const isCurrentUser = String(currentUserId) === String(user.id);
  const isModerator = ['moderator', 'admin'].includes(currentUserRole.toLowerCase());
  const canManage = isModerator || isCurrentUser;

  const avatarUrl = user.profile?.profile_photo_url || user.avatar
    ? (user.profile?.profile_photo_url || `/storage/${user.avatar}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=160&background=4F46E5&color=ffffff&rounded=true&bold=true`;

  return (
    <div className={`w-full max-w-md mx-auto bg-white rounded-lg shadow-md border overflow-hidden ${className}`}>
      {/* Górna sekcja z gradient background */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{user.name || 'Nieznany użytkownik'}</h2>
            <p className="text-blue-100 text-sm mb-3">{dept}</p>

            {/* Barcode - wyśrodkowany */}
            <div className="bg-white p-3 rounded-md text-center">
              <div className="flex justify-center">
                <Barcode
                  value={String(user.barcode ?? (`USR${user.id}`).padStart(10, '0'))}
                  format="CODE128"
                  renderer="svg"
                  height={30}
                  width={0.8}
                  displayValue={false}
                  margin={0}
                  lineColor="#111827"
                  background="white"
                />
              </div>
              <div className="text-xs text-gray-700 text-center mt-1 font-mono">
                {user.barcode || `USR${user.id}`.padStart(10, '0')}
              </div>
            </div>
          </div>

          {/* Zdjęcie w kółku po prawej stronie */}
          <div className="ml-4 flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
              <img
                src={avatarUrl}
                alt={user.name || 'User avatar'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=160&background=4F46E5&color=ffffff&rounded=true&bold=true`;
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sekcja z danymi kontaktowymi */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <div>
              <div className="font-medium">Email</div>
              <div className="text-xs">{user.email || 'brak@email.pl'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-red-500" />
            <div>
              <div className="font-medium">Adres</div>
              <div className="text-xs">ul. Polna 3</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <MessageCircle className="w-4 h-4 text-green-500" />
            <div>
              <div className="font-medium">Telefon</div>
              <div className="text-xs">123 123 123</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dolna sekcja z akcjami */}
      <div className="p-4">
        {/* Przyciski akcji - tylko ikony */}
        <div className="flex justify-center gap-3">
          {/* Szczegóły */}
          <a
            href={`/employee/employee-details/${user.id}`}
            className="inline-flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            title="Szczegóły"
          >
            <Eye className="w-5 h-5" />
          </a>

          {/* Chat */}
          <button
            type="button"
            onClick={() => (window.location.href = `/chat?other_user_id=${user.id}`)}
            className="inline-flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
            title="Rozpocznij chat"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          {/* Edukacja/Szkoła */}
          <a
            href="#"
            className="inline-flex items-center justify-center w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors"
            title="Edukacja"
          >
            <GraduationCap className="w-5 h-5" />
          </a>

          {/* praca*/}
          <a
            href="#"
            className="inline-flex items-center justify-center w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors"
            title="Kursy"
          >
            <BookOpen className="w-5 h-5" />
          </a>

          {/* Adres/Lokalizacja */}
          <a
            href="#"
            className="inline-flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            title="Lokalizacja"
          >
            <MapPin className="w-5 h-5" />
          </a>

          {/* Edytuj - dla moderatorów i właściciela konta */}
          {canManage && (
            <a
              href={`/moderator/users/${user.id}/edit`}
              className="inline-flex items-center justify-center w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
              title="Edytuj"
            >
              <Edit3 className="w-5 h-5" />
            </a>
          )}

          {/* Ustawienia - dla moderatorów i właściciela konta */}
          {canManage && (
            <a
              href={`/moderator/users/${user.id}/settings`}
              className="inline-flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
              title="Ustawienia"
            >
              <Settings className="w-5 h-5" />
            </a>
          )}
        </div>

        {/* Status badge */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Aktywny
            </span>

            {user.role && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

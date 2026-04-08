import { usePage } from '@inertiajs/react';
import { Mail, Phone, MapPin, Edit3, Settings, GraduationCap, Briefcase, Cpu, Eye, Wrench, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import Barcode from "react-barcode";
export default function EmployeeDetailsCard({ employee }: { employee: any }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const page = usePage();
  const props = page.props as any;
  const authUser = props?.auth?.user;
  const authRole = String(authUser?.role || '').toLowerCase();
  const isOwner = authUser?.id === employee?.id;
  const canViewDetails = authRole === 'moderator' || isOwner;

  if (!employee) {
    return <div className="p-4 text-center">Brak danych pracownika</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border overflow-hidden">
      {/* Sekcja 1: Nagłówek z nazwą, zdjęciem i barcode */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-start justify-between gap-6">
          <div className="flex gap-6 items-start flex-1">
            {/* Barcode */}
            <div className="bg-white px-6 py-4 rounded-2xl shadow-lg">
                <div className="flex flex-col items-center gap-2">
                <Barcode
                  value={String(employee.barcode ?? '')}
                  format="CODE128"
                  renderer="svg"
                  height={60}
                  width={1}
                  displayValue={false}
                />
              </div>
            </div>

            {/* Informacje użytkownika */}
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold mb-2">{employee.name || 'Brak nazwy'}</h1>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4" />
                <p className="text-sm">{employee.email || 'Brak email'}</p>
              </div>
              <button
                type="button"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  employee.is_active
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-400 hover:bg-gray-500 text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${employee.is_active ? 'bg-white' : 'bg-gray-200'}`}></div>
                {employee.is_active ? 'Aktywny' : 'Nieaktywny'}
              </button>
            </div>
          </div>

          {/* Zdjęcie */}
          <div className="flex flex-col items-center gap-3">
            <img
              src={employee.profile?.profile_photo_url || employee.profile_photo_url || '/storage/image/profile/man-profile-awatar.jpg'}
              alt={employee.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/storage/image/profile/man-profile-awatar.jpg';
              }}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <button
              type="button"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-blue-600 rounded-lg font-medium transition-colors shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          </div>
        </div>
      </div>

      {/* Sekcja 2: Tabela z szkołami i miejscami pracy (tylko dla moderatora i właściciela) */}
      {canViewDetails && (
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Edukacja i Kariera
          </h2>

          {/* Szkoły */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Szkoły
            </h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Szkoła</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Okres</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.schools && employee.schools.length > 0 ? (
                    employee.schools.map((school: any, index: number) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm">{school.name || 'Brak danych'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{school.period || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${school.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {school.completed ? 'Ukończona' : 'W trakcie'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-500 text-center">Brak danych o szkołach</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Miejsca pracy */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Miejsca pracy
            </h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Firma</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Stanowisko</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Okres</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.jobs && employee.jobs.length > 0 ? (
                    employee.jobs.map((job: any, index: number) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm">{job.company || 'Brak danych'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{job.position || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{job.period || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-500 text-center">Brak danych o miejscach pracy</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Przypisane maszyny */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Przypisane maszyny
            </h3>
            <div className="space-y-3">
              {employee.machines && employee.machines.length > 0 ? (
                employee.machines.map((machine: any, index: number) => (
                  <div key={index} className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between hover:bg-indigo-100 transition-colors border border-indigo-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                          <div className="bg-white px-4 py-3 rounded-xl shadow-md border border-gray-200">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-[11px] font-mono text-gray-800 font-semibold tracking-wide">
                                {machine.barcode || 'Brak'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{machine.name || 'Brak nazwy'}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/machines/${machine.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                        title="Zobacz szczegóły"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Szczegóły
                      </a>
                      <a
                        href={`/machines/${machine.id}/operations`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                        title="Operacje"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Operacje
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                  Brak przypisanych maszyn
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sekcja 3: Adres, telefon, email */}
      <div className="p-6 border-b bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Dane kontaktowe</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Adres</p>
              <p className="text-sm font-medium">{employee.address || 'Brak danych'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Telefon</p>
              <p className="text-sm font-medium">{employee.phone || 'Brak danych'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm font-medium">{employee.email || 'Brak danych'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sekcja 4: Akcje */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Akcje</h2>
        <div className="flex gap-3">

          {isOwner && (
            <a
              href={`/employee/profile/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edytuj profil
            </a>
          )}
          {authRole === 'moderator' && (
            <>
              <a
                href={`/moderator/users/${employee.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edytuj użytkownika
              </a>
              <a
                href={`/moderator/users/${employee.id}/settings`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Ustawienia
              </a>
            </>
          )}
        </div>
      </div>

      {/* Małe rozwijające okno chatu */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border-2 border-green-500 flex flex-col z-50">
          {/* Nagłówek chatu */}
          <div className="bg-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={employee.profile?.profile_photo_url || employee.profile_photo_url || '/storage/image/profile/man-profile-awatar.jpg'}
                alt={employee.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/storage/image/profile/man-profile-awatar.jpg';
                }}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <div>
                <h3 className="font-semibold">{employee.name}</h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="hover:bg-green-600 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Treść chatu */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="text-center text-sm text-gray-500 mb-4">
              Rozpocznij konwersację z {employee.name}
            </div>
            {/* Tutaj będą wyświetlane wiadomości */}
          </div>

          {/* Pole do pisania */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Napisz wiadomość..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <button
                type="button"
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Wyślij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

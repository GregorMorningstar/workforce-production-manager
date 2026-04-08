import React, { JSX, useState } from "react";
import ReactBarcode from 'react-barcode';
import { router } from "@inertiajs/react";
import { Edit, Trash2, Check, X, FileText } from "lucide-react";

export default function EducationDetailsCard({ education, auth }: any): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(false);
  if (!education) return null;

  const authUser = auth?.user ?? { id: 0, role: null };
  const isOwner = authUser.id === (education.user_profile?.user_id ?? education.user_profile_id);
  const isAdmin = ["admin", "moderator"].includes(String(authUser.role ?? "").toLowerCase());
  const isPending = (education.status ?? "pending") === "pending";

  const status = (education.status ?? 'pending').toString();
  const statusColors: Record<string,string> = {
    pending: '#FFD54F',
    approved: '#10B981',
    rejected: '#EF4444',
    edited: '#3B82F6',
  };
  const statusLabels: Record<string,string> = {
    pending: 'Oczekujący',
    approved: 'Zatwierdzony',
    rejected: 'Odrzucony',
    edited: 'Edytowany',
  };
  const borderColor = statusColors[status] ?? '#E5E7EB';

  const barcodeValue = education.barcode ?? education.certificate_number ?? (education.certificate_path ? String(education.certificate_path).split('/').pop() : (education.id ?? ''));

  const educationLevelLabels: Record<string,string> = {
    primary: 'Podstawowe',
    basic: 'Podstawowe',
    secondary: 'Średnie',
    high_school: 'Średnie',
    vocational: 'Zawodowe',
    bachelor: 'Licencjat / Inżynier',
    licencjat: 'Licencjat',
    engineer: 'Inżynier',
    master: 'Magister',
    magister: 'Magister',
    phd: 'Doktor',
    doctorate: 'Doktor',
    other: 'Inne',
  };

  const formatEducationLevel = (lvl: any) => {
    if (!lvl) return '—';
    const key = String(lvl).toLowerCase().trim().replace(/\s+/g, '_');
    return educationLevelLabels[key] ?? String(lvl);
  };

  const calcEducationMonths = (edu: any) => {
    // prefer precise dates if available
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (edu.start_date) startDate = new Date(edu.start_date);
    else if (edu.start_year) startDate = new Date(Number(edu.start_year), (edu.start_month ? Number(edu.start_month) - 1 : 0), 1);

    if (edu.end_date) endDate = new Date(edu.end_date);
    else if (edu.end_year) endDate = new Date(Number(edu.end_year), (edu.end_month ? Number(edu.end_month) - 1 : 11), 1);
    else endDate = now;

    if (!startDate || !endDate) return null;
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    return years * 12 + months + 1; // +1 to include starting month
  };

  const educationMonths = calcEducationMonths(education);

  const statusVariant = (color: string | undefined) => {
    switch (color) {
      case "green":
        return "secondary";
      case "red":
        return "destructive";
      case "gray":
        return "outline";
      default:
        return "default";
    }
  };

  const handleEdit = () => router.visit(`/employee/education/${education.id}/edit`);
  const handleDelete = () => {
    if (!confirm("Czy na pewno chcesz usunąć ten certyfikat?")) return;
    setIsLoading(true);
    router.delete(`/employee/education/${education.id}`, { onFinish: () => setIsLoading(false) });
  };
  const handleStatusChange = (status: "approved" | "rejected") => {
    if (!confirm(status === "approved" ? "Zatwierdzić certyfikat?" : "Odrzucić certyfikat?")) return;
    setIsLoading(true);
    router.put(`/admin/education/${education.id}/status`, { status }, { onFinish: () => setIsLoading(false) });
  };

  const downloadCert = async (path: string | null, name: string) => {
    if (!path) return;
    const url = (path.startsWith && path.startsWith('http')) ? path : `/storage/${path}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const extMatch = (path.match(/\.([a-zA-Z0-9]+)(?:\?|$)/) || [])[1] || 'pdf';
      const safeName = (name || 'certificate').replace(/[^a-z0-9_-]/gi, '_');
      const filename = `${safeName}_certificate.${extMatch}`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden" style={{ borderRight: `6px solid ${borderColor}`, borderBottom: `4px solid ${borderColor}` }}>
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <ReactBarcode value={String(barcodeValue ?? '')} format="CODE128" width={2} height={50} displayValue={true} />
          </div>
          <div className="ml-4 text-sm text-gray-700">
            <div className="text-xs text-gray-500">Status</div>
            <div className="text-lg font-medium">{statusLabels[status]}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-500">Szkoła</div>
          <div className="text-lg font-semibold text-gray-900">{education.school_name}</div>

          {education.school_address && (
            <div className="mt-3">
              <div className="text-sm text-gray-500">Adres</div>
              <div className="text-md font-medium text-gray-800">{education.school_address}</div>
            </div>
          )}

          <div className="mt-3 text-sm text-gray-700">
            <div><strong>Okres:</strong> {education.start_year} — {education.end_year ?? 'obecnie'}</div>
            <div className="mt-1"><strong>Poziom:</strong> {formatEducationLevel(education.education_level)}</div>
            <div className="mt-1"><strong>Czas edukacji:</strong> {educationMonths !== null ? `${educationMonths} miesięcy` : '—'}</div>
          </div>

          {education.certificate_path ? (
            <div className="mt-3">
              <div className="text-sm text-gray-500">Certyfikat</div>
              <div className="mt-2 flex items-center gap-3">
                <a href={(String(education.certificate_path).startsWith('http') ? education.certificate_path : `/storage/${education.certificate_path}`)} target="_blank" rel="noopener noreferrer">
                  <img src={(String(education.certificate_path).startsWith('http') ? education.certificate_path : `/storage/${education.certificate_path}`)} alt="certificate" className="h-20 object-contain cursor-pointer hover:scale-105 transition-transform" />
                </a>
                <button onClick={() => downloadCert(education.certificate_path, education.school_name || 'certificate')} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                  Pobierz certyfikat
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center px-3 py-2 bg-gray-100 text-gray-600 rounded">Brak certyfikatu</div>
          )}
        </div>

        <div className="space-y-2">
          {education.field_of_study && (
            <>
              <div className="text-sm text-gray-500">Kierunek</div>
              <div className="text-sm text-gray-700">{education.field_of_study}</div>
            </>
          )}

          <div className="mt-3">
            <div className="text-sm text-gray-500">Opis</div>
            <div className="mt-1 text-sm text-gray-700">{education.description ?? 'Brak opisu'}</div>
          </div>

          <div className="border-t pt-4 flex flex-wrap gap-2">
            {isOwner && isPending && (
              <>
                <button onClick={handleEdit} className="inline-flex items-center px-3 py-1 bg-white border rounded"> <Edit className="w-4 h-4 mr-2" /> Edytuj</button>
                <button onClick={handleDelete} className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded"> <Trash2 className="w-4 h-4 mr-2" /> Usuń</button>
              </>
            )}

            {isAdmin && isPending && (
              <>
                <button onClick={() => handleStatusChange('approved')} className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded"> <Check className="w-4 h-4 mr-2" /> Zatwierdź</button>
                <button onClick={() => handleStatusChange('rejected')} className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded"> <X className="w-4 h-4 mr-2" /> Odrzuć</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

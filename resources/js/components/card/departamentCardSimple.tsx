import { FactoryIcon, Users, Wrench, AlertTriangle, BarChart2, Settings, Eye, Edit3, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import Barcode from "react-barcode";
type Props = { departament?: any; user?: any; onAdd?: () => void; onEdit?: () => void; onDelete?: () => void; onHallPreview?: () => void };

export default function DepartamentCardSimple({ departament, user, onAdd, onEdit, onDelete, onHallPreview }: Props) {
  const barcodeValue = String(departament?.barcode ?? departament?.id ?? departament?.name ?? "Nazwa");

  // status może być: 'green' | 'yellow' | 'red' (fallback 'green')
  const status = (departament?.status as string) ?? 'green';

  const getStatusClasses = (s: string) => {
    switch (s) {
      case 'red':
        return { bg: 'bg-red-100', text: 'text-red-600' };
      case 'yellow':
        return { bg: 'bg-yellow-100', text: 'text-yellow-600' };
      default:
        return { bg: 'bg-green-100', text: 'text-green-600' };
    }
  };

  const statusClasses = getStatusClasses(status);

  // Action handlers (call optional callbacks if provided)
  const handleAdd = () => {
    try {
      if (typeof onAdd === 'function') onAdd();
      else console.log('Add clicked', departament);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = () => {
    try {
      if (typeof onEdit === 'function') onEdit();
      else console.log('Edit clicked', departament);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = () => {
    try {
      const name = departament?.name ?? '';
      const ok = window.confirm(`Czy na pewno usunąć dział "${name}"?`);
      if (!ok) return;
      if (typeof onDelete === 'function') onDelete();
      else console.log('Delete confirmed', departament);
    } catch (e) {
      console.error(e);
    }
  };

  const handleHallPreview = () => {
    try {
      if (typeof onHallPreview === 'function') onHallPreview();
      else console.log('Hall preview clicked', departament);
    } catch (e) {
      console.error(e);
    }
  };

  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const check = () => {
      try {
        const full = window.screen?.width ?? window.innerWidth;
        setCompact(window.innerWidth < full * 0.5);
      } catch (e) {
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      className="w-full max-w-sm mx-auto sm:max-w-none rounded-xl border border-gray-200 bg-[#F5F1E6] shadow-sm
                 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 min-h-fit
                 overflow-hidden hover:shadow-lg transition-shadow duration-150"
    >
      {/* Top: compact header with barcode and actions */}
        {/* Top: compact header with barcode and actions. Render mobile layout when `compact` is true. */}
        <div className="w-full rounded-md bg-white/90 px-2 sm:px-3 py-2 sm:py-3">
          {compact ? (
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3" title={`Kod: ${barcodeValue}`}>
                <div className="bg-white p-1.5 sm:p-2 rounded shadow-sm">
                  <FactoryIcon className="w-5 h-5 sm:w-7 sm:h-7 text-gray-700" />
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[80px] sm:max-w-[120px]">{departament?.name ?? 'Nazwa'}</div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`p-1.5 sm:p-2 rounded-full ${statusClasses.bg} flex items-center justify-center`} title={status === 'green' ? 'Status: OK' : status === 'yellow' ? 'Status: Ostrzeżenie' : 'Status: Awaria'}>
                  <FactoryIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${statusClasses.text}`} />
                </div>
                <button
                  type="button"
                  className="p-1.5 sm:p-2 rounded-md bg-white shadow-sm hover:bg-gray-50 text-gray-700 border border-gray-100"
                  aria-label="Szczegóły"
                  title="Szczegóły działu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* barcode area (desktop) */}
                <div className="hidden md:flex flex-col items-center justify-center bg-white rounded-md p-2 shadow-sm" title={`Kod: ${barcodeValue}`}>
                  <div className="w-[120px] lg:w-[150px]">
                    <Barcode
                      value={barcodeValue}
                      format="CODE128"
                      height={32}
                      width={0.8}
                      displayValue={false}
                      margin={0}
                      renderer="svg"
                      lineColor="#111827"
                      background="transparent"
                    />
                  </div>
                  <div className="mt-1 text-xs font-mono text-gray-600 select-none text-center break-words">
                    {barcodeValue}
                  </div>
                </div>

                {/* tablet/mobile compact icon and name */}
                <div className="flex md:hidden items-center gap-2 sm:gap-3" title={`Kod: ${barcodeValue}`}>
                  <div className="bg-white p-1.5 sm:p-2 rounded shadow-sm">
                    <FactoryIcon className="w-5 h-5 sm:w-7 sm:h-7 text-gray-700" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[100px] sm:max-w-[120px]">{departament?.name ?? 'Nazwa'}</div>
                </div>
              </div>

              {/* right: status + action */}
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`p-1.5 sm:p-2 rounded-full ${statusClasses.bg} flex items-center justify-center`} title={status === 'green' ? 'Status: OK' : status === 'yellow' ? 'Status: Ostrzeżenie' : 'Status: Awaria'}>
                  <FactoryIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${statusClasses.text}`} />
                </div>
                <button
                  type="button"
                  className="p-1.5 sm:p-2 rounded-md bg-white shadow-sm hover:bg-gray-50 text-gray-700 border border-gray-100"
                  aria-label="Szczegóły"
                  title="Szczegóły działu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Name: centered, stretched under top */}
      <div className="w-full text-center px-1 sm:px-2">
        <div className="text-xs sm:text-sm lg:text-base font-semibold text-gray-800 truncate" title={departament?.name ?? "Nazwa wydziału"}>
          {departament?.name ?? "Nazwa wydziału"}
        </div>
      </div>

{/* Middle: neat grid of 4 stats. In `compact` mode show vertical icon-only layout. */}
{compact ? (
  <div className="flex flex-col gap-2 flex-1">
    {/* Vertical icon-only stats */}
    <div className="flex justify-center gap-3">
      <div className="bg-white rounded-md p-2 flex items-center justify-center" title={`Ilość maszyn: ${departament.count_of_machines ?? 0}`}>
        <Wrench className="w-6 h-6 text-indigo-500" />
      </div>
      <div className="bg-white rounded-md p-2 flex items-center justify-center" title={`Ilość pracowników: ${departament.count_of_employees ?? 0}`}>
        <Users className="w-6 h-6 text-indigo-500" />
      </div>
      <div className="bg-white rounded-md p-2 flex items-center justify-center" title={`Ilość awarii: ${departament.count_of_failures ?? 0}`}>
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div className="bg-white rounded-md p-2 flex items-center justify-center" title={`Współczynnik OEE: ${departament.oee_coefficient ?? 0}`}>
        <BarChart2 className="w-6 h-6 text-green-500" />
      </div>
    </div>

    {/* Role-based menu panel */}
    <div className="bg-white/90 rounded-md px-2 sm:px-3 py-1.5 sm:py-2">
      <div className="flex justify-center gap-1 sm:gap-2">
        {user?.role === 'admin' ? (
          <>
            <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Ustawienia">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Edytuj">
              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Podgląd">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </>
        ) : user?.role === 'moderator' || user?.role === 'manager' ? (
          <>
            <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Edytuj">
              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Podgląd">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </>
        ) : (
          <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Podgląd">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </div>
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-1">
    <div className="rounded-md bg-white p-2 sm:p-3 text-xs sm:text-sm text-gray-700 flex items-center gap-2 sm:gap-3 truncate" title={`Ilość maszyn: ${departament.count_of_machines ?? 0}`}>
      <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-gray-800">{departament.count_of_machines ?? 0}</span>
        <span className="text-xs text-gray-500">Maszyny</span>
      </div>
    </div>
    <div className="rounded-md bg-white p-2 sm:p-3 text-xs sm:text-sm text-gray-700 flex items-center gap-2 sm:gap-3 truncate" title={`Ilość pracowników: ${departament.count_of_employees ?? 0}`}>
      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-gray-800">{departament.count_of_employees ?? 0}</span>
        <span className="text-xs text-gray-500">Pracownicy</span>
      </div>
    </div>
    <div className="rounded-md bg-white p-2 sm:p-3 text-xs sm:text-sm text-gray-700 flex items-center gap-2 sm:gap-3 truncate" title={`Ilość awarii: ${departament.count_of_failures ?? 0}`}>
      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-gray-800">{departament.count_of_failures ?? 0}</span>
        <span className="text-xs text-gray-500">Awarie</span>
      </div>
    </div>
    <div className="rounded-md bg-white p-2 sm:p-3 text-xs sm:text-sm text-gray-700 flex items-center gap-2 sm:gap-3 truncate" title={`Współczynnik OEE: ${departament.oee_coefficient ?? 0}`}>
      <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-gray-800">{departament.oee_coefficient ?? 0}</span>
        <span className="text-xs text-gray-500">OEE</span>
      </div>
    </div>
  </div>
)}

{/* Role-based menu panel - always visible */}
<div className="bg-white/90 rounded-md px-2 sm:px-3 py-1.5 sm:py-2">
  <div className="flex justify-center gap-1 sm:gap-2">
    {user?.role === 'admin' ? (
      <>
        <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Ustawienia">
          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Edytuj">
          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Podgląd">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </>
    ) : user?.role === 'moderator' ? (
      <>
        <button onClick={handleAdd} className="p-1.5 sm:p-2 rounded-md bg-green-100 hover:bg-green-200 text-green-700" title="Dodaj">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button onClick={handleEdit} className="p-1.5 sm:p-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700" title="Edycja">
          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button onClick={handleHallPreview} className="p-1.5 sm:p-2 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-700" title="Podgląd hali">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button onClick={handleDelete} className="p-1.5 sm:p-2 rounded-md bg-red-100 hover:bg-red-200 text-red-700" title="Usuń">
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </>
    ) : user?.role === 'manager' ? (
      <>
        <button onClick={handleEdit} className="p-1.5 sm:p-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700" title="Edytuj">
          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Podgląd">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </>
    ) : (
      <button className="p-1.5 sm:p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" title="Podgląd">
        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    )}
  </div>
</div>

{/* Bottom: description - clamp to 2 lines */}
      <div className="w-full rounded-md bg-white/90 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 leading-tight overflow-hidden" style={{ maxHeight: 40 }}>
        <div className="truncate">
          {departament?.description ?? "Brak opisu"}
        </div>
      </div>

    </div>
  );
}

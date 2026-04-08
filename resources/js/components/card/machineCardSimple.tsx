import React from "react";
import { usePage, Link, router } from "@inertiajs/react";
import Barcode from "react-barcode";
import { Wrench, WrenchIcon, Trash2, Eye, File, Users, TriangleAlertIcon, Edit3 } from "lucide-react";

type Machine = {
  id: number;
  name?: string;
  model?: string;
  serial_number?: string;
  barcode?: string;
  users?: { id: number; name?: string }[];
  owner?: { id: number; name?: string } | null;
  description?: string;
  status?: string;
  image_path?: string;
  department?: { id: number; name?: string } | null;
  user?: { id: number; name?: string } | null;
};

type Props = {
  machine: Machine;
  onEdit?: (m: Machine) => void;
  onDelete?: (m: Machine) => void;
  onView?: (m: Machine) => void;
  onAddOperation?: (m: Machine) => void;
  compact?: boolean;
  user?: any;
};

export default function MachineCardSimple({ machine, onEdit, onDelete, onView, onAddOperation, compact = false, user }: Props) {
  const page = usePage<any>();

  const machineStatuses: { value: string; label?: string; classes?: string; color?: string }[] =
    page.props?.machineStatuses ?? [];

  const statusMap = React.useMemo(
    () => machineStatuses.reduce<Record<string, any>>((acc, s) => {
      if (s?.value) acc[s.value] = s;
      return acc;
    }, {}),
    [machineStatuses]
  );

  const statusMeta = statusMap[machine.status ?? ""] ?? {};
  const borderColor = statusMeta.color ?? "#3B82F6"; // fallback blue
  const badgeClasses = statusMeta.classes ?? "bg-slate-100 text-slate-800";
  const statusLabel = statusMeta.label ?? (machine.status ?? "nieznany");

  const roles: string[] = (() => {
    const auth = page.props?.auth?.user ?? page.props?.user ?? user ?? null;
    if (!auth) return [];
    if (typeof auth.role === "string") return [auth.role];
    if (Array.isArray(auth.roles)) return auth.roles.map((r: any) => r?.name ?? r).filter(Boolean);
    return [];
  })();
  const canManage = roles.some(r => ["admin", "moderator"].includes(r));

  function handleNewOperation(e: React.MouseEvent) {
    e.preventDefault();
    if (typeof onAddOperation === "function") return onAddOperation(machine);
    router.visit(`/moderator/machines/operations/${machine.id}/add`);
  }

  function handleView(e: React.MouseEvent) {
    e.preventDefault();
    if (typeof onView === "function") return onView(machine);
    window.location.href = `/machines/failures/add-new/${machine.id}`;
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    const ok = window.confirm(`Czy na pewno usunąć maszynę "${machine.name ?? ""}"?`);
    if (!ok) return;
    if (typeof onDelete === "function") return onDelete(machine);
    router.delete(`/moderator/machines/${machine.id}`, {
      onSuccess: () => {
        window.location.reload();
      },
      onError: () => {
        alert("Błąd przy usuwaniu maszyny");
      }
    });
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault();
    if (typeof onEdit === "function") return onEdit(machine);
    router.visit(`/moderator/machines/${machine.id}/edit`);
  }

  const barcodeValue = String(machine.barcode ?? machine.serial_number ?? machine.id ?? "BRK");
  const imgSrc = machine.image_path ? `/storage/${machine.image_path}` : "https://via.placeholder.com/320x240?text=Maszyna";

  const assignedUserName =
    machine.owner?.name ||
    (machine.users && machine.users.length ? machine.users[0]?.name : null) ||
    machine.user?.name ||
    "—";

  const assignedUserId =
    machine.owner?.id ||
    (machine.users && machine.users.length ? machine.users[0]?.id : null) ||
    machine.user?.id ||
    null;

  return (
    <div
      className="w-full max-w-sm mx-auto rounded-xl border border-gray-200 bg-white shadow-sm p-3 flex flex-col gap-3 overflow-hidden"
      style={{ borderLeft: `2px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center border">
          <img src={imgSrc} alt={machine.name} className="object-cover w-full h-full" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-gray-800 truncate">{machine.name ?? "Brak nazwy"}</div>
              <div className="text-xs text-gray-500">{machine.model ?? machine.serial_number ?? "brak modelu / nr"}</div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 text-xs rounded-md ${badgeClasses}`}>{statusLabel}</span>
              {machine.department?.id ? (
                <Link
                  href={`/moderator/departments/${machine.department.id}`}
                  className="text-xs text-gray-500 hover:underline"
                >
                  {machine.department.name}
                </Link>
              ) : (
                <div className="text-xs text-gray-500">Brak działu</div>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="hidden sm:block">
              <div className="w-[110px]">
                <Barcode value={barcodeValue} format="CODE128" height={28} width={0.7} displayValue={false} margin={0} renderer="svg" lineColor="#111827" background="transparent" />
                <div className="text-xs text-center text-gray-600 mt-1 break-words">{barcodeValue}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 line-clamp-3">{machine.description ?? "Brak opisu"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-white p-2 text-xs flex items-center gap-2 border">
          <Wrench className="w-4 h-4 text-indigo-500" />
          <div>
            <div className="font-medium text-gray-800">{machine.model ?? "—"}</div>
            <div className="text-xs text-gray-500">Model</div>
          </div>
        </div>

        {assignedUserId ? (
          <Link
            href={`/moderator/users/${assignedUserId}`}
            className="rounded-md bg-white p-2 text-xs flex items-center gap-2 border hover:bg-slate-50"
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <div>
              <div className="font-medium text-gray-800">{assignedUserName}</div>
              <div className="text-xs text-gray-500">Przypisany użytkownik</div>
            </div>
          </Link>
        ) : (
          <div className="rounded-md bg-white p-2 text-xs flex items-center gap-2 border">
            <Users className="w-4 h-4 text-indigo-500" />
            <div>
              <div className="font-medium text-gray-800">{assignedUserName}</div>
              <div className="text-xs text-gray-500">Przypisany użytkownik</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Link href={`/machines/failures/add-new/${machine.id}`} onClick={(e) => handleView(e)} className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm hover:bg-slate-50">
          <TriangleAlertIcon className="text-slate-600 " style={{ color: '#ff0f0f' }} />
        </Link>

        {canManage && (
          <>
            <button onClick={handleNewOperation} className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm hover:bg-slate-50">
              <WrenchIcon className="text-blue-500" />
            </button>

            <button onClick={handleEdit} className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm hover:bg-slate-50">
              <Edit3 className="text-green-500" />
            </button>

            <button onClick={handleDelete} className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm hover:bg-slate-50">
              <Trash2 className="text-red-500" />
            </button>
          </>
        )}


      </div>
    </div>
  );
}

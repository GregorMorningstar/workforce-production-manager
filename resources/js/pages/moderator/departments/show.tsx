import React, { useState } from "react";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, Link } from "@inertiajs/react";
import MachineCardSimple from "@/components/card/machineCardSimple";

export default function DepartmentShowPage() {
    const page = usePage<any>();
    const props = page.props as any;
    const department = props.department ?? {};

    const breadcrumbs = [
        { label: "Moderator", href: "/moderator/dashboard" },
        { label: "Wydziały", href: "/moderator/departments" },
        { label: department.name ?? "Szczegóły", href: `/moderator/departments/${department.id}` },
    ];

    const machines = Array.isArray(department.machines) ? department.machines : [];
    const PER_PAGE = 6;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(machines.length / PER_PAGE));
    const startIdx = (currentPage - 1) * PER_PAGE;
    const pagedMachines = machines.slice(startIdx, startIdx + PER_PAGE);

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title={`Wydział: ${department.name || "—"}`}>
            <div className="space-y-6 pb-24">
                {/* Department Header */}
                <div className="rounded-lg border bg-white shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{department.name || "Wydział"}</h1>
                            <p className="text-sm text-gray-600 mt-1">{department.description || "Brak opisu"}</p>
                            {department.location && (
                                <p className="text-xs text-gray-500 mt-2">📍 {department.location}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href={`/moderator/departments/${department.id}/edit`}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                            >
                                Edytuj
                            </Link>
                            <Link
                                href={`/moderator/departments/${department.id}/hall-preview`}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                            >
                                Układ hali
                            </Link>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-md bg-gray-50 border">
                            <div className="text-2xl font-bold text-indigo-600">{machines.length}</div>
                            <div className="text-xs text-gray-600 mt-1">Maszyny</div>
                        </div>
                        <div className="text-center p-3 rounded-md bg-gray-50 border">
                            <div className="text-2xl font-bold text-blue-600">
                                {Array.isArray(department.users) ? department.users.length : 0}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Pracownicy</div>
                        </div>
                        <div className="text-center p-3 rounded-md bg-gray-50 border">
                            <div className="text-2xl font-bold text-red-600">{department.count_of_failure_machine ?? 0}</div>
                            <div className="text-xs text-gray-600 mt-1">Awarie</div>
                        </div>
                        <div className="text-center p-3 rounded-md bg-gray-50 border">
                            <div className="text-2xl font-bold text-green-600">{department.oee_coefficient ?? "—"}</div>
                            <div className="text-xs text-gray-600 mt-1">Wydajność</div>
                        </div>
                    </div>
                </div>

                {/* Machines Section */}
                <div className="rounded-lg border bg-white shadow-sm p-4 sm:p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Maszyny ({machines.length})</h2>

                    {pagedMachines.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pagedMachines.map((machine: any) => (
                                <MachineCardSimple key={machine.id} machine={machine} user={page.props?.auth?.user} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">Brak maszyn w tym wydziale.</p>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {machines.length > PER_PAGE && (
                <nav
                    aria-label="Pagination"
                    className="fixed bottom-6 left-1/2 z-50 w-auto -translate-x-1/2 px-4"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-gray-800 shadow-lg">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-full transition-colors ${
                                currentPage === 1
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            Poprzednia
                        </button>

                        {Array.from({ length: totalPages }).map((_, idx) => {
                            const page = idx + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded-full transition-colors ${
                                        currentPage === page
                                            ? "bg-indigo-600 text-white shadow-md scale-105"
                                            : "hover:bg-gray-100"
                                    }`}
                                    aria-current={currentPage === page ? "page" : undefined}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-full transition-colors ${
                                currentPage === totalPages
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            Następna
                        </button>
                    </div>
                </nav>
            )}
        </ModeratorLayout>
    );
}

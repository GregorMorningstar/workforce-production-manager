import ModeratorLayout from "@/layouts/ModeratorLayout";
import { Link, usePage } from "@inertiajs/react";

export default function DepartmentActiveEmployeesPage() {
    const page = usePage();
    const props = page.props as any;
    const raw = props.departments ?? [];

    const breadcrumbs = [
        { label: "Moderator", href: "/moderator/dashboard" },
        { label: "Wydziały", href: "/moderator/departments" },
        { label: "Lista pracowników", href: "/moderator/departments/active-employees" },
    ];

    const items: any[] = raw?.data ?? [];
    const links: any[] = raw?.links ?? [];

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Lista pracowników na wydziałach">
            <div className="p-4 space-y-4">
                <div className="rounded-lg border bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <h1 className="text-base font-semibold text-gray-900">Liczba pracowników na wydziałach</h1>
                    </div>

                    {items.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Wydział</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Liczba pracowników</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Pracownicy</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {items.map((department: any) => {
                                        const users = Array.isArray(department.users) ? department.users : [];
                                        const usersPreview = users.slice(0, 3).map((u: any) => u?.name).filter(Boolean).join(", ");

                                        return (
                                            <tr key={department.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{department.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-800">{department.count_of_employees ?? 0}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {usersPreview || "Brak przypisanych pracowników"}
                                                    {users.length > 3 ? "..." : ""}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Link
                                                        href={`/moderator/departments/${department.id}`}
                                                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                                                    >
                                                        Szczegóły
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-sm text-gray-600">Brak wydziałów do wyświetlenia.</div>
                    )}
                </div>
            </div>

            {links.length > 0 && (
                <nav
                    aria-label="Pagination"
                    className="fixed bottom-6 left-1/2 z-50 w-auto -translate-x-1/2 px-4"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-gray-800 shadow-lg">
                        {links.map((link: any, idx: number) => {
                            const isDisabled = !link.url;
                            const isActive = !!link.active;
                            return (
                                <Link
                                    key={idx}
                                    href={link.url ?? "#"}
                                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 transition-colors duration-150 ${
                                        isActive
                                            ? "scale-105 bg-indigo-600 text-white shadow-md"
                                            : "bg-white/0 text-gray-800 hover:bg-gray-100"
                                    } ${isDisabled ? "pointer-events-none opacity-50" : ""}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    aria-current={isActive ? "page" : undefined}
                                />
                            );
                        })}
                    </div>
                </nav>
            )}
        </ModeratorLayout>
    );
}

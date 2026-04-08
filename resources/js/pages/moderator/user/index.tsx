import { Breadcrumb } from "@/components/ui/breadcrumb";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, router as Inertia, Link } from "@inertiajs/react";
import { Braces, User } from "lucide-react";
import UserCardSimple from "../../../components/card/userCardSimple";
import React, { useState, useRef, useEffect } from "react";

export default function UserIndexPage() {
    const page = usePage().props as any;
    const users = page.users;
    const filters = page.filters ?? {};

    const [name, setName] = useState(filters.name ?? '');
    const [department, setDepartment] = useState(filters.department ?? '');
    const [barcode, setBarcode] = useState(filters.barcode ?? '');

    const Breadcrumb = [
        { label: 'Moderator', href: 'moderator/dashboard', icon: Braces },
        { label: 'Lista Pracowników', href: 'moderator/user/index', icon : User }
    ];

    const list = Array.isArray(users) ? users : users?.data ?? [];

    const debounceRef = useRef<number | null>(null);

    function doSearch(nextName: string, nextDepartment: string, nextBarcode: string) {
        Inertia.get(window.location.pathname, {
            name: nextName || undefined,
            department: nextDepartment || undefined,
            barcode: nextBarcode || undefined,
        }, { preserveState: true, replace: true, preserveScroll: true });
    }

    useEffect(() => {
        // real-time search with debounce (150ms)
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
            doSearch(name, department, barcode);
        }, 150);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [name, department, barcode]);

    function clearSearch() {
        setName(''); setDepartment(''); setBarcode('');
        doSearch('', '', '');
    }

    return (
        <ModeratorLayout  breadcrumbs={Breadcrumb}  >
            <div className="space-y-4 pb-28">
                {/* realtime search */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Szukaj po nazwie..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full sm:w-1/3 px-3 py-2 rounded border bg-white/90 text-gray-800"
                    />
                    <input
                        type="text"
                        placeholder="Dział..."
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full sm:w-1/4 px-3 py-2 rounded border bg-white/90 text-gray-800"
                    />
                    <input
                        type="text"
                        placeholder="Barcode..."
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        className="w-full sm:w-1/4 px-3 py-2 rounded border bg-white/90 text-gray-800"
                    />

                    <div className="flex gap-2">
                        <button type="button" onClick={() => doSearch(name, department, barcode)} className="px-4 py-2 bg-indigo-600 text-white rounded">Szukaj</button>
                        <button type="button" onClick={clearSearch} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Wyczyść</button>
                    </div>
                </div>

                <div>
                    {list.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                            {list.map((user: any) => (
                                <UserCardSimple user={user} key={user.id} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Brak użytkowników do wyświetlenia.</p>
                    )}
                </div>
            </div>

            {/* STICKY pagination - fixed bottom center (improved visibility) */}
            {users?.links && (
                <nav
                    aria-label="Pagination"
                    className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto px-4"
                >
                    <div className="inline-flex items-center gap-2 bg-white shadow-lg rounded-full px-3 py-2 text-sm text-gray-800 backdrop-blur-sm">
                        {users.links.map((link: any, idx: number) => {
                            const isDisabled = !link.url;
                            const isActive = !!link.active;
                            return (
                                <Link
                                    key={idx}
                                    href={link.url ?? '#'}
                                    as={isDisabled ? 'button' : undefined}
                                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full transition-colors duration-150
                                        ${isActive ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white/0 text-gray-800 hover:bg-gray-100'}
                                        ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    aria-current={isActive ? 'page' : undefined}
                                />
                            );
                        })}
                    </div>
                </nav>
            )}
        </ModeratorLayout>
    );
}

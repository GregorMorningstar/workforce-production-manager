import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import EducationUserTable from "@/components/table/educationUserTable";

export default function ConfirmationEducation() {
    const { pendingCertificates, filters: initialFilters } = usePage().props as any;
    const users = pendingCertificates?.users ?? [];
    const educationCertificates = pendingCertificates?.data ?? pendingCertificates?.educationCertificates ?? [];

    const [filters, setFilters] = useState({
        name: initialFilters?.name ?? "",
        school: initialFilters?.school ?? "",
        year_from: initialFilters?.year_from ?? "",
        year_to: initialFilters?.year_to ?? "",
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(window.location.pathname, filters, { preserveState: true, replace: true });
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const clearFilters = () => {
        setFilters({ name: "", school: "", year_from: "", year_to: "" });
    };

    return (
        <ModeratorLayout breadcrumbs={[
            { label: 'Moderator', href: '/moderator' },
            { label: 'Użytkownicy', href: '/moderator/users' },
            { label: 'Potwierdzanie Edukacji', href: '/moderator/users/confirmation-education' },
        ]}>
            <div className="p-4">
                <div className="mb-4 flex gap-2">
                    <input value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} placeholder="Imię/Nazwisko" className="border px-2 py-1" />
                    <input value={filters.school} onChange={e => setFilters({...filters, school: e.target.value})} placeholder="Nazwa szkoły" className="border px-2 py-1" />
                    <input value={filters.year_from} onChange={e => setFilters({...filters, year_from: e.target.value})} placeholder="Rok od" className="border px-2 py-1 w-24" />
                    <input value={filters.year_to} onChange={e => setFilters({...filters, year_to: e.target.value})} placeholder="Rok do" className="border px-2 py-1 w-24" />
                    <button onClick={clearFilters} className="px-3 py-1 bg-gray-600 text-white rounded">Wyczyść</button>
                </div>

                <EducationUserTable users={users} educationCertificates={educationCertificates} />

                {pendingCertificates?.links && (
                    <nav className="mt-4">
                        <ul className="inline-flex gap-2">
                            {pendingCertificates.links.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <a
                                        href={link.url ?? '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 border rounded ${link.active ? 'bg-gray-200' : 'bg-white'}`}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </div>
        </ModeratorLayout>
    );
}



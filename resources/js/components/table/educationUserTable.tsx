import React, { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

export default function EducationUserTable({
    users,
    educationCertificates,
}: {
    users: any[];
    educationCertificates: any[];
}) {
    const findUser = (id: number) => users?.find((u: any) => u.id === id) ?? null;

    const [alert, setAlert] = useState<null | { type: 'success' | 'error'; text: string }>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (alert) {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => setAlert(null), 5000);
        }

        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        };
    }, [alert]);

    const approve = (id: number) => {
        if (!confirm("Potwierdzić świadectwo?")) return;
        router.post(`/moderator/users/education/approve`, { certificate_id: id, action: 'approve' }, {
            onSuccess: (page: any) => {
                const msg = page.props?.flash?.success ?? 'Zatwierdzono świadectwo.';
                setAlert({ type: 'success', text: msg });
            },
            onError: (errors: any) => {
                const msg = errors?.certificate ?? Object.values(errors || {})[0] ?? 'Wystąpił błąd.';
                setAlert({ type: 'error', text: String(msg) });
            }
        });
    };

    const reject = (id: number) => {
        if (!confirm("Odrzucić świadectwo?")) return;
        router.post(`/moderator/users/education/approve`, { certificate_id: id, action: 'reject' }, {
            onSuccess: (page: any) => {
                const msg = page.props?.flash?.success ?? 'Odrzucono świadectwo.';
                setAlert({ type: 'success', text: msg });
            },
            onError: (errors: any) => {
                const msg = errors?.certificate ?? Object.values(errors || {})[0] ?? 'Wystąpił błąd.';
                setAlert({ type: 'error', text: String(msg) });
            }
        });
    };

    return (
        <div>
            {alert && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(900px,90%)] p-3 rounded-md text-sm font-medium ${alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {alert.text}
                </div>
            )}

            <div className="overflow-x-auto bg-white shadow rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Użytkownik</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nazwa szkoły</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Typ szkoły</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Poziom edukacji</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Adres</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Okres edukacji</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Akcje</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Podgląd</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {educationCertificates?.length ? educationCertificates.map((cert: any) => {
                        const relatedUser = cert.user ?? findUser(cert.user_id);
                        const displayName = relatedUser
                            ? (relatedUser.name ?? relatedUser.user?.name ?? relatedUser.email ?? '—')
                            : '—';

                        // show only year (works for YYYY, YYYY-MM-DD or numeric year)
                        const start = cert.start_year ? String(cert.start_year).slice(0, 4) : "-";
                        const end = cert.end_year ? String(cert.end_year).slice(0, 4) : "-";
                        const previewUrl = cert.certificate_file_path ? `/storage/${cert.certificate_file_path}` : null;
                        const getSchoolTypeLabel = (raw?: string | null) => {
                            if (!raw) return null;
                            const r = String(raw).toLowerCase().trim();
                            const map: Record<string, string> = {
                                'primary': 'szkoła podstawowa',
                                'elementary': 'szkoła podstawowa',
                                'secondary': 'szkoła średnia',
                                'high': 'liceum',
                                'liceum': 'liceum',
                                'vocational': 'szkoła zawodowa',
                                'technical': 'technikum',
                                'technikum': 'technikum',
                                'university': 'uczelnia',
                                'college': 'uczelnia',
                                'kindergarten': 'przedszkole',
                                'gymnasium': 'gimnazjum',
                            };

                            // direct map
                            if (map[r]) return map[r];

                            // try to match keywords
                            for (const [k, v] of Object.entries(map)) {
                                if (r.includes(k)) return v;
                            }

                            // if already Polish-looking words, return as-is capitalized
                            if (['szkoła', 'liceum', 'technikum', 'uczelnia', 'przedszkole', 'gimnazjum', 'zawodowa'].some(p => r.includes(p))) {
                                return raw.charAt(0).toUpperCase() + raw.slice(1);
                            }

                            return null;
                        };

                        const schoolTypeLabel = getSchoolTypeLabel(cert.school_type ?? cert.type ?? cert.schoolType ?? null);
                        const getEducationLabel = (raw?: string | null) => {
                            if (!raw) return null;
                            const r = String(raw).toLowerCase().trim();
                            const map: Record<string, string> = {
                                'primary': 'Szkoła podstawowa',
                                'gymnasium': 'Gimnazjum',
                                'secondary': 'Średnie',
                                'vocational': 'Średnie zawodowe',
                                'bachelor': 'Licencjat',
                                'engineer': 'Inżynier',
                                'master': 'Magister',
                                'doctor': 'Doktor',
                            };

                            return map[r] ?? (r ? (r.charAt(0).toUpperCase() + r.slice(1)) : null);
                        };

                        const educationLabel = getEducationLabel(cert.education_level ?? cert.degree ?? null);

                        return (
                            <tr key={cert.id}>
                                <td className="px-4 py-3 text-sm text-gray-700">{displayName}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{cert.school_name ?? "—"}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{schoolTypeLabel ?? "—"}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{educationLabel ?? "—"}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{cert.school_address ?? "—"}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{start} — {end}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        cert.status === "approved" ? "bg-green-100 text-green-800" :
                                        cert.status === "rejected" ? "bg-red-100 text-red-800" :
                                        "bg-yellow-100 text-yellow-800"
                                    }`}>
                                        {cert.status ?? "pending"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                    <div className="inline-flex gap-2">
                                        <button
                                            onClick={() => approve(cert.id)}
                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                        >
                                            Potwierdź
                                        </button>
                                        <button
                                            onClick={() => reject(cert.id)}
                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                        >
                                            Odrzuć
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                    {previewUrl ? (
                                        <a
                                            href={previewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline text-sm"
                                        >
                                            Podgląd
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Brak</span>
                                    )}
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={9}>
                                Brak rekordów
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
</div>

    );

}

import React from 'react';
import { router, usePage } from '@inertiajs/react';

export default function WorkUserTable({ pendingCertificates }: { pendingCertificates: any }) {
    const page = usePage().props as any;
    const authUserId = page.auth?.user?.id ?? null;
    const authUserRole = page.auth?.user?.role ?? null;

    const isModerator = () => {
        if (!authUserRole) return false;
        try {
            const r = String(authUserRole).toLowerCase();
            return r === 'moderator' || r === 'mod' || r.includes('moder');
        } catch (e) {
            return false;
        }
    };

    const formatDate = (value: string | null | undefined) => {
        if (!value) return null;
        try {
            const d = new Date(value);
            return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch (e) {
            return value;
        }
    };

    const handleApprove = (id: number) => {
        if (!confirm('Potwierdzić zatwierdzenie certyfikatu?')) return;
        router.post(`/moderator/users/work-certificates/approve`, { certificate_id: id, action: 'approve' });
    };

    const handleReject = (id: number) => {
        if (!confirm('Potwierdzić odrzucenie certyfikatu?')) return;
        router.post(`/moderator/users/work-certificates/approve`, { certificate_id: id, action: 'reject' });
    };

    const handlePreview = (id: number) => {
        router.get(`/employment-certificates/${id}/preview`);
    };

    const handleEdit = (id: number) => {
        router.get(`/employee/employment-certificates/${id}/edit`);
    };

    const handleDelete = (id: number) => {
        if (!confirm('Czy na pewno usunąć certyfikat?')) return;
        router.delete(`/employee/employment-certificates/${id}`);
    };



    return (
        <div>

            <table className="table-auto w-full">
                <thead>
                    <tr>
                        <th className="px-4 py-2">Użytkownik</th>
                        <th className="px-4 py-2">Nazwa firmy</th>
                        <th className="px-4 py-2">NIP</th>
                        <th className="px-4 py-2">Okres zatrudnienia</th>
                        <th className="px-4 py-2">Podgląd</th>
                        <th className="px-4 py-2">Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const list = pendingCertificates?.data ?? [];
                        const unique = Array.from(new Map(list.map((c: any) => [c.id, c])).values());
                        return unique.map((cert: any) => (
                        <tr key={cert.id} className="border-t">
                            <td className="px-4 py-2">{cert.user?.name || '—'}</td>
                            <td className="px-4 py-2 max-w-xs">
                                <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                                    {cert.company_name}
                                </div>
                            </td>
                            <td className="px-4 py-2">{cert.nip}</td>
                            <td className="px-4 py-2">{formatDate(cert.start_date) ?? '—'} — {cert.end_date ? formatDate(cert.end_date) : 'do teraz'}</td>
                            <td className="px-4 py-2">
                                {cert.work_certificate_file_path ? (
                                    <a href={cert.work_certificate_file_path} target="_blank" rel="noreferrer" className="text-blue-600 underline">Podgląd</a>
                                ) : (
                                    <span>Brak</span>
                                )}
                            </td>
                            <td className="px-4 py-2">
                                <div className="flex flex-wrap gap-2 items-center">
                                    {/* Moderator actions */}
                                    {isModerator() && (
                                        <div className="flex flex-wrap gap-2 sm:flex-row flex-col">
                                            <button onClick={() => handleApprove(cert.id)} className="px-2 py-1 bg-green-600 text-white rounded">Zatwierdź</button>
                                            <button onClick={() => handleReject(cert.id)} className="px-2 py-1 bg-red-600 text-white rounded">Odrzuć</button>
                                            <button onClick={() => handlePreview(cert.id)} className="px-2 py-1 bg-blue-600 text-white rounded">Podgląd</button>
                                        </div>
                                    )}

                                    {/* Owner actions */}
                                    {authUserId && cert.user_id === authUserId && (
                                        <div className="flex flex-wrap gap-2 sm:flex-row flex-col">
                                            <button onClick={() => handlePreview(cert.id)} className="px-2 py-1 bg-blue-600 text-white rounded">Podgląd</button>
                                            {cert.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleEdit(cert.id)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edytuj</button>
                                                    <button onClick={() => handleDelete(cert.id)} className="px-2 py-1 bg-red-600 text-white rounded">Usuń</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                        ));
                    })()}
                </tbody>
            </table>


        </div>
    );
}

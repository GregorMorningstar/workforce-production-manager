import WorkUserTable from "@/components/table/workUserTable";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, router, Link } from "@inertiajs/react";
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function ConfirmationWorkCertificates() {
    const { pendingCertificates, filters: initialFilters, flash } = usePage().props as any;
    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) {
            setShowError(true);
            const timer = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.error]);

    const breadcrumbs = [
        { label: 'Moderator', href: '/moderator' },
        { label: 'Użytkownicy', href: '/moderator/users' },
        { label: 'Potwierdzanie Świadectw Pracy', href: '/moderator/users/confirmation-work-certificates' },
    ];

    const [name, setName] = useState(initialFilters?.name ?? '');
    const [companyName, setCompanyName] = useState(initialFilters?.company_name ?? '');
    const [nip, setNip] = useState(initialFilters?.nip ?? '');
    const [startDateFrom, setStartDateFrom] = useState(initialFilters?.start_date_from ?? '');
    const [startDateTo, setStartDateTo] = useState(initialFilters?.start_date_to ?? '');
    const [endDateFrom, setEndDateFrom] = useState(initialFilters?.end_date_from ?? '');
    const [endDateTo, setEndDateTo] = useState(initialFilters?.end_date_to ?? '');
    const [perPage, setPerPage] = useState(initialFilters?.per_page ?? pendingCertificates?.per_page ?? 6);

    const debounceRef = useRef<number | null>(null);

    const doSearch = (nextFilters: any) => {
        router.get(window.location.pathname, nextFilters, { preserveState: true, replace: true, preserveScroll: true });
    };

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            doSearch({
                name: name || undefined,
                company_name: companyName || undefined,
                nip: nip || undefined,
                start_date_from: startDateFrom || undefined,
                start_date_to: startDateTo || undefined,
                end_date_from: endDateFrom || undefined,
                end_date_to: endDateTo || undefined,
                per_page: perPage || undefined,
            });
        }, 250);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [name, companyName, nip, startDateFrom, startDateTo, endDateFrom, endDateTo, perPage]);

    const clearFilters = () => {
        setName(''); setCompanyName(''); setNip(''); setStartDateFrom(''); setStartDateTo(''); setEndDateFrom(''); setEndDateTo('');
        setPerPage(6);
        doSearch({ per_page: 6 });
    };

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Potwierdzenia Świadectw Pracy">
            <div className="p-4">
                {/* Success Message */}
                {showSuccess && flash?.success && (
                    <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-sm">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="flex-1">{flash.success}</span>
                        <button onClick={() => setShowSuccess(false)} className="text-green-600 hover:text-green-800">
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {showError && flash?.error && (
                    <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-sm">
                        <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <span className="flex-1">{flash.error}</span>
                        <button onClick={() => setShowError(false)} className="text-red-600 hover:text-red-800">
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}

                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div>
                        <label className="text-sm text-gray-600">Użytkownik</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Imię / nazwisko" className="w-full px-3 py-2 rounded border" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Nazwa firmy</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nazwa firmy" className="w-full px-3 py-2 rounded border" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">NIP</label>
                        <input type="text" value={nip} onChange={e => setNip(e.target.value)} placeholder="NIP" className="w-full px-3 py-2 rounded border" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Start (od)</label>
                        <input type="date" value={startDateFrom} onChange={e => setStartDateFrom(e.target.value)} className="w-full px-3 py-2 rounded border" />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Koniec (do)</label>
                        <input type="date" value={endDateTo} onChange={e => setEndDateTo(e.target.value)} className="w-full px-3 py-2 rounded border" />
                    </div>

                    <div className="pt-6">
                        <button type="button" onClick={clearFilters} className="px-3 py-2 bg-gray-200 rounded">Wyczyść</button>
                    </div>
                </div>

                <WorkUserTable pendingCertificates={pendingCertificates}  />

                {/* Pagination (sticky bottom) */}
                {pendingCertificates?.links && (
                    <nav aria-label="Pagination" className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto px-4">
                        <div className="inline-flex items-center gap-2 bg-white shadow-lg rounded-full px-3 py-2 text-sm text-gray-800 backdrop-blur-sm">
                            {pendingCertificates.links.map((link: any, idx: number) => {
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
            </div>

        </ModeratorLayout>
    );
}

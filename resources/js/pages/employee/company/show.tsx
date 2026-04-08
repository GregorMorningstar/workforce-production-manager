import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import CompanyDetailsCard from '@/components/card/company card';

interface PageProps {
    success?: string;
    company?: any;
}

export default function EmployeeCompanyShow() {
    const { company, success } = usePage<any>().props;
    const companies = Array.isArray(company) ? company : (company ? [company] : []);
    const ITEMS_PER_PAGE = 3;
    const [page, setPage] = useState<number>(1);
    const totalPages = Math.max(1, Math.ceil(companies.length / ITEMS_PER_PAGE));
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [query, setQuery] = useState<string>('');

    const filteredCompanies = companies.filter(c => {
        const s = (c.status ?? c.status_name ?? c.status_key ?? 'pending').toString().toLowerCase();
        const name = (c.company_name ?? c.name ?? c.company ?? '').toString().toLowerCase();
        const matchesStatus = statusFilter === 'all' ? true : s === statusFilter;
        const matchesQuery = query.trim() === '' ? true : name.includes(query.trim().toLowerCase());
        return matchesStatus && matchesQuery;
    });
    const filteredTotalPages = Math.max(1, Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE));
    const statusCounts = companies.reduce((acc: Record<string, number>, item: any) => {
        const s = (item.status ?? item.status_name ?? item.status_key ?? 'pending').toString().toLowerCase();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pendingCount = statusCounts['pending'] ?? 0;
    const approvedCount = statusCounts['approved'] ?? 0;
    const rejectedCount = statusCounts['rejected'] ?? 0;
    const editedCount = statusCounts['edited'] ?? 0;

    const breadcrumbs = [
        { label: 'Pracownik', href: '/employee' },
        { label: 'Firmy', href: '/employee/company' }
    ];

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="">
            <div className="space-y-6">
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-green-700">
                                    {success}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            {companies.length > 0 ? (
                                <div className="flex gap-4 items-center">
                                    <div className="px-4 py-2 bg-gray-50 rounded">
                                        <div className="text-xs text-gray-500">Ilość firm</div>
                                        <div className="text-2xl font-bold">{companies.length}</div>
                                    </div>

                                    <div className="px-4 py-2 bg-yellow-50 rounded">
                                        <div className="text-xs text-yellow-600">Wnioski oczekujące</div>
                                        <div className="text-xl font-semibold text-yellow-700">{pendingCount}</div>
                                    </div>

                                    <div className="px-4 py-2 bg-green-50 rounded">
                                        <div className="text-xs text-green-600">Wnioski zatwierdzone</div>
                                        <div className="text-xl font-semibold text-green-700">{approvedCount}</div>
                                    </div>

                                    <div className="px-4 py-2 bg-red-50 rounded">
                                        <div className="text-xs text-red-600">Wnioski odrzucone</div>
                                        <div className="text-xl font-semibold text-red-700">{rejectedCount}</div>
                                    </div>

                                    <div className="px-4 py-2 bg-blue-50 rounded">
                                        <div className="text-xs text-blue-600">Wnioski edytowane</div>
                                        <div className="text-xl font-semibold text-blue-700">{editedCount}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-600">Brak dodanych firm.</div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <a href="/employee/company/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">Dodaj nową firmę</a>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded px-2 py-1">
                            <option value="all">Wszystkie statusy</option>
                            <option value="pending">Oczekujące</option>
                            <option value="approved">Zatwierdzone</option>
                                    <option value="rejected">Odrzucone</option>
                                    <option value="edited">Edytowane</option>
                                </select>
                                <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Szukaj firmy..." className="border rounded px-2 py-1" />
                            </div>

                            {filteredCompanies.length > ITEMS_PER_PAGE && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <button className="px-3 py-1 bg-gray-200 rounded" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Poprzednia</button>
                                    {Array.from({ length: filteredTotalPages }).map((_, i) => (
                                        <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{i + 1}</button>
                                    ))}
                                    <button className="px-3 py-1 bg-gray-200 rounded" disabled={page >= filteredTotalPages} onClick={() => setPage(p => Math.min(filteredTotalPages, p + 1))}>Następna</button>
                                </div>
                            )}
                </div>
                <div>
                    <CompanyDetailsCard company={filteredCompanies} page={page} onPageChange={setPage} itemsPerPage={ITEMS_PER_PAGE} />
                </div>

                
            </div>
        </EmployeeLayout>
    );
}

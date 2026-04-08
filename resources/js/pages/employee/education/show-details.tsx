import React from 'react';
import EducationDetailsCard from "@/components/card/education-card-detals";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { usePage, Link } from "@inertiajs/react";

export default function EducationDetails() {

    const breadcrumbs = [
        { label: 'Pracownicy', href: '/employee' },
        { label: 'Szczegóły Wykształcenia', href: '#' },
    ];

    const page = usePage();
    const { education, pagination } = page.props as {
      education?: any | any[];
      pagination?: {
        prev_url?: string | null;
        next_url?: string | null;
        current: number;
        total: number;
      };
    };

    const educations = Array.isArray(education) ? education : (education ? [education] : []);
    const ITEMS_PER_PAGE = 3;
    const [pageIndex, setPageIndex] = React.useState<number>(1);
    const totalPages = Math.max(1, Math.ceil(educations.length / ITEMS_PER_PAGE));

    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [query, setQuery] = React.useState<string>('');

    const filteredEducations = educations.filter((item: any) => {
      const s = (item.status ?? item.status_name ?? 'pending').toString().toLowerCase();
      const name = (item.school_name ?? '').toString().toLowerCase();
      const matchesStatus = statusFilter === 'all' ? true : s === statusFilter;
      const matchesQuery = query.trim() === '' ? true : name.includes(query.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
    const paginated = filteredEducations.slice((pageIndex - 1) * ITEMS_PER_PAGE, pageIndex * ITEMS_PER_PAGE);

    const statusCounts = educations.reduce((acc: Record<string, number>, item: any) => {
      const s = (item.status ?? item.status_name ?? 'pending').toString().toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const pendingCount = statusCounts['pending'] ?? 0;
    const approvedCount = statusCounts['approved'] ?? 0;
    const rejectedCount = statusCounts['rejected'] ?? 0;
    const editedCount = statusCounts['edited'] ?? 0;

    const filteredTotalPages = Math.max(1, Math.ceil(filteredEducations.length / ITEMS_PER_PAGE));

    const getPageRange = (total: number, current: number, maxVisible = 3) => {
      if (total <= maxVisible) return Array.from({ length: total }).map((_, i) => i + 1);
      let start = Math.max(1, current - Math.floor(maxVisible / 2));
      let end = start + maxVisible - 1;
      if (end > total) { end = total; start = total - maxVisible + 1; }
      return Array.from({ length: end - start + 1 }).map((_, i) => start + i);
    };

    if (educations.length === 0) {
        return (
          <EmployeeLayout breadcrumbs={breadcrumbs} title="Szczegóły Wykształcenia">
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">Szczegóły Wykształcenia</h1>
              <div className="text-sm text-gray-600">Brak danych o wykształceniu.</div>
            </div>
          </EmployeeLayout>
        );
    }

    return (
      <EmployeeLayout breadcrumbs={breadcrumbs} title="Szczegóły Wykształcenia" >
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Szczegóły Wykształcenia</h1>

          <div className="space-y-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex gap-4 items-center">
                    <div className="px-4 py-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">Ilość szkół</div>
                      <div className="text-2xl font-bold">{educations.length}</div>
                    </div>
                    <div className="px-4 py-2 bg-yellow-50 rounded">
                      <div className="text-xs text-yellow-600">Wnioski oczekujące</div>
                      <div className="text-xl font-semibold text-yellow-700">{pendingCount}</div>
                    </div>
                    <div className="px-4 py-2 bg-green-50 rounded">
                      <div className="text-xs text-green-600">Zatwierdzone</div>
                      <div className="text-xl font-semibold text-green-700">{approvedCount}</div>
                    </div>
                    <div className="px-4 py-2 bg-red-50 rounded">
                      <div className="text-xs text-red-600">Odrzucone</div>
                      <div className="text-xl font-semibold text-red-700">{rejectedCount}</div>
                    </div>
                    <div className="px-4 py-2 bg-blue-50 rounded">
                      <div className="text-xs text-blue-600">Edytowane</div>
                      <div className="text-xl font-semibold text-blue-700">{editedCount}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPageIndex(1); }} className="border rounded px-2 py-1">
                        <option value="all">Wszystkie statusy</option>
                        <option value="pending">Oczekujące</option>
                        <option value="approved">Zatwierdzone</option>
                        <option value="rejected">Odrzucone</option>
                        <option value="edited">Edytowane</option>
                      </select>
                      <input value={query} onChange={e => { setQuery(e.target.value); setPageIndex(1); }} placeholder="Szukaj szkoły..." className="border rounded px-2 py-1" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a href="/employee/education/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">Dodaj szkołę</a>
                </div>
              </div>
              {filteredEducations.length > ITEMS_PER_PAGE && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button className="px-3 py-1 bg-gray-200 rounded" disabled={pageIndex <= 1} onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}>Poprzednia</button>
                  {(() => {
                    const range = getPageRange(filteredTotalPages, pageIndex, 3);
                    const parts = [] as any[];
                    if (range[0] > 1) {
                      parts.push(
                        <button key="first" onClick={() => setPageIndex(1)} className={`px-3 py-1 rounded ${pageIndex === 1 ? 'bg-blue-600 text-white' : 'bg-white border'}`}>1</button>
                      );
                      if (range[0] > 2) parts.push(<span key="left-ell" className="px-2">...</span>);
                    }
                    range.forEach(p => parts.push(
                      <button key={p} onClick={() => setPageIndex(p)} className={`px-3 py-1 rounded ${pageIndex === p ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{p}</button>
                    ));
                    if (range[range.length - 1] < filteredTotalPages) {
                      if (range[range.length - 1] < filteredTotalPages - 1) parts.push(<span key="right-ell" className="px-2">...</span>);
                      parts.push(<button key="last" onClick={() => setPageIndex(filteredTotalPages)} className={`px-3 py-1 rounded ${pageIndex === filteredTotalPages ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{filteredTotalPages}</button>);
                    }
                    return parts;
                  })()}
                  <button className="px-3 py-1 bg-gray-200 rounded" disabled={pageIndex >= filteredTotalPages} onClick={() => setPageIndex(Math.min(filteredTotalPages, pageIndex + 1))}>Następna</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paginated.map((e: any) => (
                <EducationDetailsCard key={e.id ?? e.certificate_path ?? Math.random()} education={e} />
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            {filteredEducations.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center mb-4">
                <button className="px-3 py-1 bg-gray-200 rounded" disabled={pageIndex <= 1} onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}>Poprzednia</button>
                {(() => {
                  const range = getPageRange(filteredTotalPages, pageIndex, 3);
                  const parts = [] as any[];
                  if (range[0] > 1) {
                    parts.push(
                      <button key="first-bottom" onClick={() => setPageIndex(1)} className={`px-3 py-1 rounded ${pageIndex === 1 ? 'bg-blue-600 text-white' : 'bg-white border'}`}>1</button>
                    );
                    if (range[0] > 2) parts.push(<span key="left-ell-b" className="px-2">...</span>);
                  }
                  range.forEach(p => parts.push(
                    <button key={`b-${p}`} onClick={() => setPageIndex(p)} className={`px-3 py-1 rounded ${pageIndex === p ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{p}</button>
                  ));
                  if (range[range.length - 1] < filteredTotalPages) {
                    if (range[range.length - 1] < filteredTotalPages - 1) parts.push(<span key="right-ell-b" className="px-2">...</span>);
                    parts.push(<button key="last-bottom" onClick={() => setPageIndex(filteredTotalPages)} className={`px-3 py-1 rounded ${pageIndex === filteredTotalPages ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{filteredTotalPages}</button>);
                  }
                  return parts;
                })()}
                <button className="px-3 py-1 bg-gray-200 rounded" disabled={pageIndex >= filteredTotalPages} onClick={() => setPageIndex(Math.min(filteredTotalPages, pageIndex + 1))}>Następna</button>
              </div>
            )}

            {pagination && (
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Pozycja <span className="font-medium">{pagination.current}</span> z{' '}
                    <span className="font-medium">{pagination.total}</span>
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {pagination.prev_url && (
                      <Link
                        href={pagination.prev_url}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 focus:outline-offset-0"
                      >
                        <span className="sr-only">Poprzedni</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    )}
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                      {pagination.current} z {pagination.total}
                    </span>
                    {pagination.next_url && (
                      <Link
                        href={pagination.next_url}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 focus:outline-offset-0"
                      >
                        <span className="sr-only">Następny</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    )}
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </EmployeeLayout>
    );
}

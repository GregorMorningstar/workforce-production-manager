import { useState, useEffect } from 'react';
import ReactBarcode from 'react-barcode';

export default function CompanyDetailsCard(props : {company: any, page?: number, onPageChange?: (p:number)=>void, itemsPerPage?: number}) {
    const raw = props.company ?? [];
    const companies = Array.isArray(raw) ? raw : [raw];
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const downloadCert = async (path: string | null, name: string) => {
        if (!path) return;
        const url = (path.startsWith && path.startsWith('http')) ? path : `/storage/${path}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Network response was not ok');
            const blob = await res.blob();
            const extMatch = (path.match(/\.([a-zA-Z0-9]+)(?:\?|$)/) || [])[1] || 'pdf';
            const safeName = (name || 'certificate').replace(/[^a-z0-9_-]/gi, '_');
            const filename = `${safeName}_certificate.${extMatch}`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            // fallback: open in new tab
            window.open(url, '_blank', 'noopener');
        }
    };

    const ITEMS_PER_PAGE = props.itemsPerPage ?? 6;
    const [internalPage, setInternalPage] = useState<number>(props.page ?? 1);
    const page = props.page ?? internalPage;
    const setPageHandler = (p: number) => {
        if (props.onPageChange) props.onPageChange(p);
        setInternalPage(p);
    };
    const totalPages = Math.max(1, Math.ceil(companies.length / ITEMS_PER_PAGE));
    const paginated = companies.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // sync if parent changes page prop
    useEffect(() => {
        if (typeof props.page === 'number') setInternalPage(props.page);
    }, [props.page]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {paginated.map((c: any, idx: number) => {
                const id = c.id ?? c.company_id ?? idx;
                const userName = c.user?.name ?? c.user_name ?? c.name ?? 'Brak imienia';
                const companyName = c.company_name ?? c.name ?? c.company ?? 'Brak nazwy firmy';
                const certPath = c.work_certificate_file_path ?? c.certificate_path ?? null;
                const start = c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : (c.start ? c.start.split('T')[0] : '—');
                const end = c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : (c.end ? c.end.split('T')[0] : '—');
                const street = c.street ?? c.address ?? '';
                const city = c.city ?? '';
                const zip = c.zip_code ?? c.zip ?? '';
                const nip = c.nip ?? c.nip_number ?? c.vat ?? '—';
                const position = c.position ?? c.additional_info ?? c.job_description ?? '';

                const barcodeValue = (c.barcode ?? c.barcode_value ?? c.nip ?? id);
                const status = (c.status ?? c.status_name ?? c.status_key ?? 'pending').toString();
                const statusColors: Record<string,string> = {
                    pending: '#FFD54F',
                    approved: '#10B981',
                    rejected: '#EF4444',
                    edited: '#3B82F6',
                };
                const borderColor = statusColors[status] ?? '#E5E7EB';
                const toggleExpanded = () => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

                const words = (position || '').toString().trim().split(/\s+/).filter(Boolean);
                const isLong = words.length > 50;
                const shortDesc = isLong ? words.slice(0,50).join(' ') + '...' : position;

                // oblicz dni robocze między start i end
                const startStr = c.start_date ?? c.start ?? null;
                const endStr = c.end_date ?? c.end ?? null;
                const calcWorkingDays = (s: string | null, e: string | null) => {
                    if (!s || !e) return null;
                    const startD = new Date(s);
                    const endD = new Date(e);
                    if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return null;
                    let count = 0;
                    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
                        const day = d.getDay();
                        if (day !== 0 && day !== 6) count++;
                    }
                    return count;
                };
                const workedDays = calcWorkingDays(startStr, endStr);

                const formatWorkedDays = (days: number | null) => {
                    if (days === null) return '—';
                    // ponad rok -> lata, miesiące i dni
                    if (days > 365) {
                        const years = Math.floor(days / 365);
                        const rem = days % 365;
                        const months = Math.floor(rem / 30);
                        const daysRem = rem % 30;
                        const parts: string[] = [];
                        parts.push(`${years} ${years === 1 ? 'rok' : 'lat'}`);
                        if (months) parts.push(`${months} ${months === 1 ? 'miesiąc' : 'mies.'}`);
                        if (daysRem) parts.push(`${daysRem} ${daysRem === 1 ? 'dzień' : 'dni'}`);
                        return parts.join(' ');
                    }

                    // ponad 31 dni -> miesiące i dni
                    if (days > 31) {
                        const months = Math.floor(days / 30);
                        const daysRem = days % 30;
                        const parts: string[] = [];
                        parts.push(`${months} ${months === 1 ? 'miesiąc' : 'mies.'}`);
                        if (daysRem) parts.push(`${daysRem} ${daysRem === 1 ? 'dzień' : 'dni'}`);
                        return parts.join(' ');
                    }

                    return `${days} ${days === 1 ? 'dzień' : 'dni'}`;
                };

                return (
                    <div key={id} className="bg-white shadow rounded-lg overflow-hidden" style={{ borderRight: `6px solid ${borderColor}`, borderBottom: `4px solid ${borderColor}` }}>
                        {/* Top bar: barcode + description and action buttons */}
                        <div className="px-4 pt-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <ReactBarcode value={String(barcodeValue)} format="CODE128" width={2} height={50} displayValue={true} />
                                </div>
                                <div className="ml-4 text-sm text-gray-700">
                                    <div className="text-xs text-gray-500">Przepracowany czas</div>
                                    <div className="text-lg font-medium">{formatWorkedDays(workedDays)}</div>
                                </div>

                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            {/* Section 1: top-left */}
                            <div className="space-y-2">
                                <div className="text-sm text-gray-500">Użytkownik</div>
                                <div className="text-lg font-semibold text-gray-900">{userName}</div>

                                <div className="mt-3">
                                    <div className="text-sm text-gray-500">Certyfikat</div>
                                    {certPath ? (
                                            <a href={(certPath.startsWith('http') ? certPath : `/storage/${certPath}`)} target="_blank" rel="noopener noreferrer">
                                                <img src={(certPath.startsWith('http') ? certPath : `/storage/${certPath}`)} alt="certificate" className="mt-2 h-20 object-contain cursor-pointer hover:scale-105 transition-transform" />
                                            </a>
                                        ) : (
                                        <div className="mt-2 inline-flex items-center px-3 py-2 bg-gray-100 text-gray-600 rounded">Brak certyfikatu</div>
                                    )}
                                </div>

                                <div className="mt-3 text-sm text-gray-700">
                                    <div><strong>Czas pracy:</strong> {start} — {end}</div>
                                    <div className="mt-1"><strong>Firma:</strong> {companyName}</div>
                                </div>
                            </div>

                            {/* Section 2: top-right */}
                            <div className="space-y-2">
                                <div className="text-sm text-gray-500">Adres firmy</div>
                                <div className="text-md font-medium text-gray-800">{street}{street && (city || zip) ? ', ' : ''}{city} {zip}</div>
                                <div className="text-sm text-gray-600 mt-1">NIP: <span className="font-medium">{nip}</span></div>

                                <div className="mt-3">
                                    <div className="text-sm text-gray-500">Opis stanowiska</div>
                                    <div className="mt-1 text-sm text-gray-700">{position || 'Brak opisu stanowiska'}</div>
                                </div>
                            </div>
                        </div>


                    </div>
                );
                })}
            </div>

            {/* Pagination controls */}
            {companies.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button className="px-3 py-1 bg-gray-200 rounded" disabled={page <= 1} onClick={() => setPageHandler(Math.max(1, page - 1))}>Poprzednia</button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPageHandler(i + 1)}
                            className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                            {i + 1}
                        </button>
                    ))}
                    <button className="px-3 py-1 bg-gray-200 rounded" disabled={page >= totalPages} onClick={() => setPageHandler(Math.min(totalPages, page + 1))}>Następna</button>
                </div>
            )}
        </div>
    );
}

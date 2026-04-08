import React, { useState, useEffect, FormEvent } from 'react';
import { Link } from '@inertiajs/react';

type NavLink = { href: string; label: string };
type Props = {
    onSearch?: (barcode: string) => void;
    onPageChange?: (page: number) => void;
    links?: NavLink[];
    initialPage?: number;
};

export default function ModeratorDepartmentNavMenu({ onSearch, onPageChange, links, initialPage = 1 }: Props) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState<number>(initialPage);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const totalPages = 5;

    const navLinks: NavLink[] = links ?? [
        { href: '/moderator/departments', label: 'Wszystkie' },
        { href: '/moderator/departments/add-new', label: 'Dodaj' },
    ];

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (typeof onSearch === 'function') onSearch(q);
        else console.log('Search barcode:', q);
    };

    // Auto-search when user types (debounced)
    useEffect(() => {
        const q = query.trim();
        const timer = setTimeout(() => {
            if (typeof onSearch === 'function') onSearch(q);
            else console.log('Auto search barcode:', q);
        }, 350);
        return () => clearTimeout(timer);
    }, [query, onSearch]);

    const gotoPage = (p: number) => {
        setPage(p);
        if (typeof onPageChange === 'function') onPageChange(p);
    };

    return (
        <nav className="w-full bg-white border p-2 sm:p-3 flex items-center gap-4 justify-start mx-4 sm:mx-6">
            {/* Left: search */}
            <form onSubmit={submitSearch} className="flex items-center gap-2 w-56 mr-6 sm:mr-8">
                <input
                    aria-label="Szukaj barcode"
                    placeholder="Szukaj barcode"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <button type="submit" className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Szukaj</button>
            </form>

            {/* Center: links */}
            <div className="flex items-center gap-2 ml-4">
                {navLinks.map((l) => {
                    const active = currentPath === l.href || (l.href !== '/' && currentPath.startsWith(l.href));
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`text-sm px-2 py-1 rounded ${
                                active ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            aria-current={active ? 'page' : undefined}
                        >
                            {l.label}
                        </Link>
                    );
                })}
            </div>


        </nav>
    );
}

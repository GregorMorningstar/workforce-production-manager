import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import EducationCard from '@/components/EducationCard';

interface Education {
    id: number;
    startYear: string;
    endYear?: string;
    isOngoing: boolean;
    degree: string;
    schoolName: string;
    schoolAddress?: string;
    isApproved: boolean;
    certificate?: string;
    createdAt: string;
    userId: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface PageProps {
    auth: {
        user: User;
    };
    educations: {
        data: Education[];
        links: any[];
        meta: PaginationData;
    };
    [key: string]: any;
}

export default function EducationIndex() {
    const { auth, educations } = usePage<PageProps>().props;
    const user = auth.user;

    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'degree' | 'school'>('newest');
    const [filterBy, setFilterBy] = useState<string>('all');

    const breadcrumbs = [
        { label: 'Pracownik', href: '/employee' },
        { label: 'Edukacja', href: '/employee/edukation' }
    ];

    // Funkcja mapująca wartości enuma (zgodna z EducationsDegree)
    const getDegreeLabel = (degree: string): string => {
        const labels: Record<string, string> = {
            'primary': 'Szkoła podstawowa',
            'gymnasium': 'Gimnazjum',
            'secondary': 'Średnie',
            'vocational': 'Średnie zawodowe',
            'bachelor': 'Licencjat',
            'engineer': 'Inżynier',
            'master': 'Magister',
            'doctor': 'Doktor',
        };
        return labels[degree] || degree;
    };

    // Filtrowanie i sortowanie edukacji
    const processEducations = () => {
        let filtered = educations.data;

        // Filtrowanie
        if (filterBy !== 'all') {
            if (filterBy === 'approved') {
                filtered = filtered.filter(edu => edu.isApproved);
            } else if (filterBy === 'pending') {
                filtered = filtered.filter(edu => !edu.isApproved);
            } else if (filterBy === 'ongoing') {
                filtered = filtered.filter(edu => edu.isOngoing);
            } else {
                filtered = filtered.filter(edu => edu.degree === filterBy);
            }
        }

        // Sortowanie
        switch (sortBy) {
            case 'newest':
                return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'oldest':
                return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'degree':
                return filtered.sort((a, b) => a.degree.localeCompare(b.degree));
            case 'school':
                return filtered.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
            default:
                return filtered;
        }
    };

    const sortedEducations = processEducations();

    // Opcje z enuma EducationsDegree - używam funkcji getDegreeLabel
    const getDegreeOptions = () => {
        const enumDegrees = ['primary', 'gymnasium', 'secondary', 'vocational', 'bachelor', 'engineer', 'master', 'doctor'];
        const enumOptions = enumDegrees.map(degree => ({
            value: degree,
            label: getDegreeLabel(degree)
        }));

        return [
            { value: 'all', label: 'Wszystkie' },
            { value: 'approved', label: 'Zatwierdzone' },
            { value: 'pending', label: 'Oczekujące' },
            { value: 'ongoing', label: 'W trakcie' },
            ...enumOptions
        ];
    };

    const degreeOptions = getDegreeOptions();

    const getStatsMessage = () => {
        if (educations.data.length === 0) {
            return "Nie masz jeszcze żadnych edukacji.";
        }

        const approved = educations.data.filter(edu => edu.isApproved).length;
        const pending = educations.data.filter(edu => !edu.isApproved).length;
        const ongoing = educations.data.filter(edu => edu.isOngoing).length;

        return `Razem: ${educations.data.length} • Zatwierdzone: ${approved} • Oczekujące: ${pending} • W trakcie: ${ongoing}`;
    };

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="Moje edukacje">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Moje edukacje</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {getStatsMessage()}
                        </p>
                    </div>
                    <Link href="/employee/edukation/create">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            ➕ Dodaj edukację
                        </button>
                    </Link>
                </div>

                {/* Filtry i sortowanie */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sortuj według:
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Od najnowszej</option>
                                <option value="oldest">Od najstarszej</option>
                                <option value="school">Nazwa szkoły A-Z</option>
                                <option value="degree">Rodzaj edukacji</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtruj według:
                            </label>
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {degreeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista edukacji */}
                <div className="space-y-4">
                    {sortedEducations.length > 0 ? (
                        sortedEducations.map((education) => (
                            <EducationCard
                                key={education.id}
                                education={education}
                                currentUser={user}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📚</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filterBy === 'all' ? 'Brak edukacji' : 'Brak edukacji spełniających kryteria'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {filterBy === 'all'
                                    ? 'Dodaj swoją pierwszą edukację, aby rozpocząć budowanie profilu.'
                                    : 'Spróbuj zmienić filtry lub dodać nową edukację.'
                                }
                            </p>
                            <Link href="/employee/edukation/create">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                    Dodaj pierwszą edukację
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Paginacja */}
                {educations.meta.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                        <div className="flex flex-1 justify-between sm:hidden">
                            {educations.links.find(link => link.label === 'Previous') && (
                                <Link
                                    href={educations.links.find(link => link.label === 'Previous')?.url || ''}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Poprzednia
                                </Link>
                            )}
                            {educations.links.find(link => link.label === 'Next') && (
                                <Link
                                    href={educations.links.find(link => link.label === 'Next')?.url || ''}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Następna
                                </Link>
                            )}
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Pokazano <span className="font-medium">{educations.meta.from}</span> do{' '}
                                    <span className="font-medium">{educations.meta.to}</span> z{' '}
                                    <span className="font-medium">{educations.meta.total}</span> wyników
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    {educations.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || ''}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                link.active
                                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                            } ${
                                                index === 0 ? 'rounded-l-md' : ''
                                            } ${
                                                index === educations.links.length - 1 ? 'rounded-r-md' : ''
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}

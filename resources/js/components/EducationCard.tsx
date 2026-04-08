import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Edit2, Trash2, Check } from 'lucide-react';

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
    role: string;
}

interface EducationCardProps {
    education: Education;
    currentUser: User;
}

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

const getDegreeColor = (degree: string): string => {
    const colors: Record<string, string> = {
        'primary': 'border-l-blue-400 bg-blue-50',
        'secondary': 'border-l-green-400 bg-green-50',
        'vocational': 'border-l-yellow-400 bg-yellow-50',
        'bachelor': 'border-l-purple-400 bg-purple-50',
        'engineer': 'border-l-indigo-400 bg-indigo-50',
        'master': 'border-l-red-400 bg-red-50',
        'doctor': 'border-l-pink-400 bg-pink-50',
    };
    return colors[degree] || 'border-l-gray-400 bg-gray-50';
};

const handleEdit = (id: number) => {
    router.get(`/employee/edukation/edit/${id}`);
};

const handleDelete = (id: number) => {
    if (confirm('Czy na pewno chcesz usunąć tę edukację?')) {
        router.delete(`/employee/edukation/${id}`);
    }
};

const handleApprove = (id: number) => {
    if (confirm('Czy na pewno chcesz zatwierdzić tę edukację?')) {
        router.put(`/employee/edukation/${id}/approve`);
    }
};

export default function EducationCard({ education, currentUser }: EducationCardProps) {
    const isOwner = currentUser.id === education.userId;
    const isModerator = currentUser.role === 'moderator';
    const canEdit = (isOwner && !education.isApproved) || isModerator;
    const canDelete = (isOwner && !education.isApproved) || isModerator;
    const canApprove = isModerator && !education.isApproved;

    return (
        <div className={`rounded-lg border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${getDegreeColor(education.degree)}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                            {education.schoolName}
                        </h3>
                        {education.isApproved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Zatwierdzona
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⏳ Oczekuje na zatwierdzenie
                            </span>
                        )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                        <p>
                            <span className="font-medium">Rodzaj:</span> {getDegreeLabel(education.degree)}
                        </p>
                        <p>
                            <span className="font-medium">Okres:</span> {education.startYear}
                            {education.isOngoing ? ' - obecnie' : (education.endYear ? ` - ${education.endYear}` : '')}
                            {education.isOngoing && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    W trakcie
                                </span>
                            )}
                        </p>
                        {education.schoolAddress && (
                            <p>
                                <span className="font-medium">Adres:</span> {education.schoolAddress}
                            </p>
                        )}
                        {education.certificate && (
                            <p>
                                <span className="font-medium">Świadectwo:</span>
                                <span className="ml-1 text-blue-600 hover:text-blue-800">
                                    📄 Załączone
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Przyciski akcji */}
            {(canEdit || canDelete || canApprove) && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    {canEdit && (
                        <button
                            onClick={() => handleEdit(education.id)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                            <Edit2 className="inline-block w-4 h-4 mr-1" /> Edytuj
                        </button>
                    )}

                    {canDelete && (
                        <button
                            onClick={() => handleDelete(education.id)}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                            <Trash2 className="inline-block w-4 h-4 mr-1" /> Usuń
                        </button>
                    )}

                    {canApprove && (
                        <button
                            onClick={() => handleApprove(education.id)}
                            className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                            <Check className="inline-block w-4 h-4 mr-1" /> Zatwierdź
                        </button>
                    )}

                    {/* Info kto może wykonać akcje */}
                    <div className="ml-auto text-xs text-gray-400">
                        {isModerator && <span>Moderator</span>}
                        {isOwner && !isModerator && <span>Właściciel</span>}
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faCalendar, faFileText, faTag, faTrash } from '@fortawesome/free-solid-svg-icons';

interface Leave {
    id: number;
    start_date: string;
    end_date: string;
    type: string;
    description?: string;
    status: string;
    user_id: number;
}

interface PageProps {
    leave: Leave;
    [key: string]: any;
}

const LEAVE_TYPES = {
    annual: 'Urlop wypoczynkowy',
    sick: 'Urlop zdrowotny',
    unpaid: 'Urlop bezpłatny',
    parental: 'Urlop rodzicielski',
    compassionate: 'Urlop okolicznościowy',
    on_demand: 'Urlop na żądanie',
};

export default function EditLeave() {
    const { leave } = usePage<PageProps>().props;

    const [formData, setFormData] = useState({
        start_date: leave.start_date,
        end_date: leave.end_date,
        type: leave.type,
        description: leave.description || '',
    });

    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const breadcrumbs = [
        { label: 'Panel pracownika', href: 'employee.dashboard' },
        { label: 'Kalendarz', href: 'employee.calendar.index' },
        { label: 'Edycja urlopu', href: '#' },
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Wyczyść błędy dla tego pola
        if (errors[field]) {
            setErrors((prev: any) => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const calculateWorkingDays = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const holidays = [
            '2025-01-01', '2025-01-06', '2025-05-01', '2025-05-03',
            '2025-08-15', '2025-11-01', '2025-11-11', '2025-12-25', '2025-12-26'
        ];

        let workingDays = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dateStr = d.toISOString().split('T')[0];

            // Pomiń weekendy i święta
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
                workingDays++;
            }
        }
        return workingDays;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Podstawowa walidacja
        const newErrors: any = {};

        if (!formData.start_date) {
            newErrors.start_date = 'Data rozpoczęcia jest wymagana';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'Data zakończenia jest wymagana';
        }

        if (!formData.type) {
            newErrors.type = 'Typ urlopu jest wymagany';
        }

        if (formData.start_date && formData.end_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);

            if (startDate > endDate) {
                newErrors.end_date = 'Data zakończenia musi być późniejsza niż data rozpoczęcia';
            }

            // Sprawdź czy data nie jest w przeszłości (oprócz urlopów chorobowych)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (formData.type !== 'sick' && formData.type !== 'compassionate' && startDate < today) {
                newErrors.start_date = 'Data rozpoczęcia nie może być wcześniejsza niż dzisiejsza';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        const submitData = {
            ...formData,
            working_days_count: calculateWorkingDays(formData.start_date, formData.end_date),
            _method: 'PUT'
        };

        router.put(`/employee/calendar/update/${leave.id}`, submitData, {
            onSuccess: () => {
                // Przekieruj na kalendarz
                window.location.href = '/employee/calendar';
            },
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
            onFinish: () => {
                setLoading(false);
            }
        });
    };

    const handleCancel = () => {
        window.location.href = `/employee/calendar/show/${leave.id}`;
    };

    const handleDelete = () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        setLoading(true);

        router.delete(`/employee/calendar/delete/${leave.id}`, {
            onSuccess: () => {
                window.location.href = '/employee/calendar';
            },
            onError: (errors) => {
                console.error('Błąd podczas usuwania urlopu:', errors);
                setLoading(false);
                setShowDeleteConfirm(false);
            },
            onFinish: () => {
                setLoading(false);
            }
        });
    };

    const workingDays = formData.start_date && formData.end_date
        ? calculateWorkingDays(formData.start_date, formData.end_date)
        : 0;

    return (
        <EmployeeLayout title="Edycja urlopu" breadcrumbs={breadcrumbs}>
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-lg">
                    {/* Nagłówek */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
                        <h2 className="text-2xl font-bold flex items-center">
                            <FontAwesomeIcon icon={faCalendar} className="mr-3" />
                            Edycja urlopu
                        </h2>
                        <p className="mt-2 text-blue-100">
                            Możesz edytować datę, typ i opis urlopu oczekującego na zatwierdzenie
                        </p>
                    </div>

                    {/* Formularz */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Data rozpoczęcia */}
                            <div>
                                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faCalendar} className="mr-2 text-blue-600" />
                                    Data rozpoczęcia
                                </label>
                                <input
                                    type="date"
                                    id="start_date"
                                    value={formData.start_date}
                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                        errors.start_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.start_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                                )}
                            </div>

                            {/* Data zakończenia */}
                            <div>
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faCalendar} className="mr-2 text-blue-600" />
                                    Data zakończenia
                                </label>
                                <input
                                    type="date"
                                    id="end_date"
                                    value={formData.end_date}
                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                        errors.end_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.end_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                                )}
                            </div>
                        </div>

                        {/* Typ urlopu */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                <FontAwesomeIcon icon={faTag} className="mr-2 text-blue-600" />
                                Typ urlopu
                            </label>
                            <select
                                id="type"
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                    errors.type ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <option value="">Wybierz typ urlopu</option>
                                {Object.entries(LEAVE_TYPES).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                            )}
                        </div>

                        {/* Opis */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                <FontAwesomeIcon icon={faFileText} className="mr-2 text-blue-600" />
                                Opis (opcjonalny)
                            </label>
                            <textarea
                                id="description"
                                rows={4}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none ${
                                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Dodaj opis lub powód urlopu..."
                                disabled={loading}
                                maxLength={1000}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                {formData.description.length}/1000 znaków
                            </p>
                        </div>

                        {/* Podsumowanie */}
                        {workingDays > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Podsumowanie urlopu</h4>
                                <div className="text-sm text-blue-700">
                                    <p>Liczba dni roboczych: <span className="font-semibold">{workingDays}</span></p>
                                    <p>Typ urlopu: <span className="font-semibold">
                                        {formData.type ? LEAVE_TYPES[formData.type as keyof typeof LEAVE_TYPES] : 'Nie wybrano'}
                                    </span></p>
                                </div>
                            </div>
                        )}

                        {/* Przyciski */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading && !showDeleteConfirm ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Zapisywanie...
                                    </div>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                                        Zapisz zmiany
                                    </>
                                )}
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg focus:ring-2 transition font-medium disabled:opacity-50 ${
                                    showDeleteConfirm 
                                        ? 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-500' 
                                        : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                                }`}
                            >
                                {loading && showDeleteConfirm ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Usuwanie...
                                    </div>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                        {showDeleteConfirm ? 'Potwierdź usunięcie' : 'Usuń wniosek'}
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (showDeleteConfirm) {
                                        setShowDeleteConfirm(false);
                                    } else {
                                        handleCancel();
                                    }
                                }}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 transition font-medium disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                {showDeleteConfirm ? 'Anuluj usuwanie' : 'Anuluj'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </EmployeeLayout>
    );
}

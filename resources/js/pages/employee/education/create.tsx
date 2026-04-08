import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';

interface EducationDegree {
    value: string;
    label: string;
}

interface School {
    id: number;
    name: string;
    address: string;
    city: string;
    type: string;
}

const educationDegrees: EducationDegree[] = [
    { value: 'primary', label: 'Szkoła podstawowa' },
    { value: 'gymnasium', label: 'Gimnazjum' },
    { value: 'secondary', label: 'Średnie' },
    { value: 'vocational', label: 'Średnie zawodowe' },
    { value: 'bachelor', label: 'Licencjat' },
    { value: 'engineer', label: 'Inżynier' },
    { value: 'master', label: 'Magister' },
    { value: 'doctor', label: 'Doktor' },
];

export default function EmployeeEducationCreate() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isOngoing, setIsOngoing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [schoolSuggestions, setSchoolSuggestions] = useState<School[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const breadcrumbs = [
        { label: 'Pracownik', href: '/employee' },
        { label: 'Edukacja', href: '/employee/edukation' },
        { label: 'Dodaj', href: '/employee/edukation/create' }
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        // Panel 1 - Lata edukacji
        startYear: '',
        endYear: '',
        // Panel 2 - Szczegóły szkoły
        degree: '',
        schoolName: '',
        schoolAddress: '',
        certificate: null as File | null,
    });

    const currentYear = new Date().getFullYear();

    const goToNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const validateCurrentStep = () => {
        if (currentStep === 1) {
            const hasStartYear = data.startYear && parseInt(data.startYear) >= 1900;
            const hasEndYearIfNeeded = isOngoing || (data.endYear && parseInt(data.endYear) >= parseInt(data.startYear));
            return hasStartYear && hasEndYearIfNeeded;
        }
        if (currentStep === 2) {
            return data.degree && data.schoolName;
        }
        return true;
    };

    const handleIsOngoingChange = (checked: boolean) => {
        setIsOngoing(checked);
        if (checked) {
            setData({
                ...data,
                endYear: '',
                certificate: null
            });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('certificate', file);
    };

    const searchSchools = async (query: string) => {
        if (query.length < 2) {
            setSchoolSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await fetch(`/api/schools/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            const schools: School[] = await response.json();
            setSchoolSuggestions(schools);
            setShowSuggestions(schools.length > 0);
        } catch (error) {
            console.error('Błąd podczas wyszukiwania szkół:', error);
            setSchoolSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSchoolNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('schoolName', value);
        searchSchools(value);
    };

    const selectSchool = (school: School) => {
        setData({
            ...data,
            schoolName: school.name,
            schoolAddress: school.address
        });
        setShowSuggestions(false);
        setSchoolSuggestions([]);
    };

    const handleSchoolInputBlur = () => {
        // Opóźnienie przed ukryciem sugestii, żeby kliknięcie działało
        setTimeout(() => {
            setShowSuggestions(false);
        }, 200);
    };

    const handleConfirmSubmit = () => {
        setShowConfirmation(false);
        post('/employee/education', {
            onSuccess: () => {
                alert('Profil został pomyślnie zapisany!');
            },
            onError: (errors: Record<string, any>) => {
                console.log('Błędy walidacji:', errors);
            }
        });
    };

    const handleFinalSubmit = () => {
        setShowConfirmation(false);
        post('/employee/education', {
            onSuccess: () => {
                alert('Profil został pomyślnie zapisany!');
            },
            onError: (errors) => {
                console.log('Błędy walidacji:', errors);
            }
        });
    };

    const handleCancelConfirmation = () => {
        setShowConfirmation(false);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const getSelectedDegreeLabel = () => {
        return educationDegrees.find(deg => deg.value === data.degree)?.label || '';
    };

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="Dodaj edukację">
            <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded shadow mt-4">
                <header className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-800">Dodaj nową edukację</h1>

                    {/* Progress indicator */}
                    <div className="flex items-center mt-4 mb-6">
                        {[1, 2, 3].map((step) => (
                            <React.Fragment key={step}>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                    currentStep >= step
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${
                                        currentStep > step ? 'bg-sky-600' : 'bg-gray-200'
                                    }`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="text-sm text-gray-600">
                        {currentStep === 1 && "Krok 1: Okres edukacji - Podaj lata rozpoczęcia i zakończenia"}
                        {currentStep === 2 && "Krok 2: Szczegóły szkoły - Rodzaj, nazwa i dodatkowe informacje"}
                        {currentStep === 3 && "Krok 3: Podsumowanie - Sprawdź dane przed zapisaniem"}
                    </div>
                </header>

                <form onSubmit={submit} className="space-y-6">
                    {/* Panel 1 - Okres edukacji */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Rok rozpoczęcia <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max={currentYear}
                                        value={data.startYear}
                                        onChange={(e) => setData('startYear', e.target.value)}
                                        placeholder="np. 2015"
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                            errors.startYear ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.startYear && <div className="text-xs text-red-600 mt-1">{errors.startYear}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Rok zakończenia {!isOngoing && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="number"
                                        min={data.startYear || "1900"}
                                        max={currentYear + 10}
                                        value={data.endYear}
                                        onChange={(e) => setData('endYear', e.target.value)}
                                        placeholder="np. 2019"
                                        disabled={isOngoing}
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                            errors.endYear ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.endYear && <div className="text-xs text-red-600 mt-1">{errors.endYear}</div>}
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="isOngoing"
                                    name="isOngoing"
                                    type="checkbox"
                                    checked={isOngoing}
                                    onChange={(e) => handleIsOngoingChange(e.target.checked)}
                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isOngoing" className="ml-2 block text-sm text-gray-700">
                                    Edukacja trwa (obecnie uczę się)
                                </label>
                            </div>

                            {data.startYear && data.endYear && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Czas trwania edukacji: {parseInt(data.endYear) - parseInt(data.startYear)} lat
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Panel 2 - Szczegóły szkoły */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Rodzaj edukacji <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.degree}
                                    onChange={(e) => setData('degree', e.target.value)}
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        errors.degree ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                >
                                    <option value="">Wybierz rodzaj edukacji</option>
                                    {educationDegrees.map((degree) => (
                                        <option key={degree.value} value={degree.value}>
                                            {degree.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.degree && <div className="text-xs text-red-600 mt-1">{errors.degree}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nazwa szkoły/uczelni <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.schoolName}
                                        onChange={handleSchoolNameChange}
                                        onBlur={handleSchoolInputBlur}
                                        onFocus={() => data.schoolName.length >= 2 && schoolSuggestions.length > 0 && setShowSuggestions(true)}
                                        placeholder="np. PANS Krosno, Uniwersytet Warszawski, Technikum Elektroniczne"
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10 ${
                                            errors.schoolName ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {searchLoading && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
                                        </div>
                                    )}

                                    {/* Dropdown z sugestiami */}
                                    {showSuggestions && schoolSuggestions.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {schoolSuggestions.map((school) => (
                                                <div
                                                    key={school.id}
                                                    onClick={() => selectSchool(school)}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="flex flex-col">
                                                        <div className="font-medium text-gray-900 text-sm">
                                                            {school.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            📍 {school.address}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {school.type} • {school.city}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.schoolName && <div className="text-xs text-red-600 mt-1">{errors.schoolName}</div>}
                                <div className="text-xs text-gray-500 mt-1">
                                    Zacznij pisać nazwę szkoły aby zobaczyć podpowiedzi
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Adres szkoły/uczelni
                                </label>
                                <textarea
                                    value={data.schoolAddress}
                                    onChange={(e) => setData('schoolAddress', e.target.value)}
                                    rows={2}
                                    placeholder="np. ul. Krakowskie Przedmieście 26/28, 00-927 Warszawa"
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        errors.schoolAddress ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.schoolAddress && <div className="text-xs text-red-600 mt-1">{errors.schoolAddress}</div>}
                            </div>

                            {!isOngoing && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Świadectwo/Dyplom
                                    </label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
                                        <div className="space-y-1 text-center">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                stroke="currentColor"
                                                fill="none"
                                                viewBox="0 0 48 48"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label
                                                    htmlFor="certificate"
                                                    className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500"
                                                >
                                                    <span>Wybierz plik</span>
                                                    <input
                                                        id="certificate"
                                                        name="certificate"
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                        onChange={handleFileUpload}
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <p className="pl-1">lub przeciągnij tutaj</p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                PDF, JPG, PNG, DOC do 10MB
                                            </p>
                                            {data.certificate && (
                                                <p className="text-xs text-green-600 mt-2">
                                                    Wybrano: {data.certificate.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Załącz skan świadectwa lub dyplomu jeśli posiadasz
                                    </p>
                                    {errors.certificate && <div className="text-xs text-red-600 mt-1">{errors.certificate}</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Panel 3 - Podsumowanie */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Podsumowanie edukacji</h3>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-700">Okres edukacji</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><span className="font-medium">Lata:</span>
                                                {data.startYear} {isOngoing ? '- obecnie' : (data.endYear ? `- ${data.endYear}` : '- brak daty zakończenia')}
                                                {isOngoing && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">W trakcie</span>}
                                            </p>
                                            {data.startYear && data.endYear && (
                                                <p><span className="font-medium">Czas trwania:</span> {parseInt(data.endYear) - parseInt(data.startYear)} lat</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-700">Szczegóły szkoły</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><span className="font-medium">Rodzaj:</span> {getSelectedDegreeLabel()}</p>
                                            <p><span className="font-medium">Nazwa:</span> {data.schoolName}</p>
                                            {data.schoolAddress && (
                                                <p><span className="font-medium">Adres:</span> {data.schoolAddress}</p>
                                            )}
                                            {data.certificate && (
                                                <p><span className="font-medium">Świadectwo:</span>
                                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        📄 {data.certificate.name}
                                                    </span>
                                                </p>
                                            )}
                                            {!data.certificate && !isOngoing && (
                                                <p><span className="font-medium">Świadectwo:</span>
                                                    <span className="ml-2 text-gray-400 italic">Nie załączono</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            Sprawdź dane przed zapisaniem
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>Upewnij się, że wszystkie dane edukacyjne są poprawne. Po zapisaniu będziesz mógł je edytować.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between pt-6 border-t">
                        <div className="flex items-center gap-3">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={goToPrevStep}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Wstecz
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => router.get('/employee/edukation')}
                                className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Anuluj
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={goToNextStep}
                                    disabled={!validateCurrentStep()}
                                    className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Dalej
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleConfirmSubmit}
                                    disabled={processing}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                                >
                                    Potwierdź i wyślij
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Modal potwierdzenia wysłania */}
                {showConfirmation && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={handleCancelConfirmation}>
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
                            <div className="mt-3 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Potwierdź zapisanie edukacji</h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
                                        Czy na pewno chcesz zapisać dane edukacji?
                                        Po potwierdzeniu informacje zostaną wysłane do systemu.
                                    </p>
                                    <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Podsumowanie:</p>
                                        <p className="text-xs text-gray-600">• Rodzaj: {getSelectedDegreeLabel()}</p>
                                        <p className="text-xs text-gray-600">• Szkoła: {data.schoolName}</p>
                                        <p className="text-xs text-gray-600">• Lata: {data.startYear} - {isOngoing ? 'obecnie' : data.endYear}</p>
                                        <p className="text-xs text-gray-600">• Status: {isOngoing ? 'W trakcie nauki' : 'Zakończone'}</p>
                                    </div>
                                </div>
                                <div className="items-center px-4 py-3">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCancelConfirmation}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleFinalSubmit}
                                            disabled={processing}
                                            className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                                        >
                                            {processing ? 'Zapisywanie...' : 'Tak, zapisz'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}

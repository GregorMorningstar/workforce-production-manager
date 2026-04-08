import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';

interface CompanyData {
    ok: boolean;
    nip?: string;
    name?: string;
    address?: string;
    street?: string;
    zip?: string;
    city?: string;
    error?: string;
}

export default function EmployeeCompanyCreate() {
    const [loading, setLoading] = useState(false);
    const [nipError, setNipError] = useState<string>('');
    const [currentStep, setCurrentStep] = useState(1);
    const [currentlyWorking, setCurrentlyWorking] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const breadcrumbs = [
        { label: 'Pracownik', href: '/employee' },
        { label: 'Firma', href: '/employee/company' },
        { label: 'Dodaj', href: '/employee/company/create' }
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        // Panel 1 - Dane firmy
        nip: '',
        name: '',
        address: '',
        street: '',
        zip: '',
        city: '',
        // Panel 2 - Czas pracy i stanowisko
        workStartDate: '',
        workEndDate: '',
        position: '',
        jobDescription: '',
        workCertificate: null as File | null,
    });

    const fetchCompanyData = async (nip: string) => {
        if (nip.length < 10) return;

        setLoading(true);
        setNipError('');

        try {
            const response = await fetch(`/api/company/nip-lookup/${nip}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            const result: CompanyData = await response.json();

            if (result.ok && result.name) {
                setData({
                    ...data,
                    nip: result.nip || nip,
                    name: result.name,
                    address: result.address || '',
                    street: result.street || '',
                    zip: result.zip || '',
                    city: result.city || '',
                });
            } else {
                // W przypadku braku danych z API, ustaw NIP na sztywno i pozwól na ręczne wypełnienie
                setData({
                    ...data,
                    nip: nip, // NIP na sztywno
                });
                setNipError(result.error || 'Nie znaleziono danych dla podanego NIP. Możesz wypełnić dane ręcznie.');
            }
        } catch (error) {
            // W przypadku błędu połączenia, ustaw NIP na sztywno i pozwól na ręczne wypełnienie
            setData({
                ...data,
                nip: nip, // NIP na sztywno
            });
            setNipError('Błąd podczas pobierania danych. Możesz wypełnić dane ręcznie.');
            console.error('Error fetching company data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nipValue = e.target.value.replace(/\D/g, ''); // Tylko cyfry
        setData('nip', nipValue);
        setNipError('');

        // Automatyczne pobieranie danych gdy NIP ma 10 cyfr
        if (nipValue.length === 10) {
            fetchCompanyData(nipValue);
        }
    };

    const formatNip = (nip: string) => {
        return nip.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1-$2-$3-$4');
    };

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
            return data.nip && data.name;
        }
        if (currentStep === 2) {
            const hasRequiredFields = data.workStartDate && data.position;
            // Jeśli nie pracuje obecnie, wymagaj daty zakończenia
            const hasEndDateIfNeeded = currentlyWorking || data.workEndDate;
            return hasRequiredFields && hasEndDateIfNeeded;
        }
        return true;
    };

    const handleCurrentlyWorkingChange = (checked: boolean) => {
        setCurrentlyWorking(checked);
        if (checked) {
            // Jeśli ciągle pracuje, wyczyść datę zakończenia i świadectwo pracy
            setData({
                ...data,
                workEndDate: '',
                workCertificate: null
            });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('workCertificate', file);
    };

    const handleConfirmSubmit = () => {
        setShowConfirmation(true);
    };

    const handleFinalSubmit = () => {
        setShowConfirmation(false);
        document.querySelector('form')?.requestSubmit();
    };

    const handleCancelConfirmation = () => {
        setShowConfirmation(false);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/employee/company', {
            onSuccess: () => {
                reset();
                alert('Firma została pomyślnie dodana!');
            },
            onError: (errors) => {
                console.log('Błędy walidacji:', errors);
            }
        });
    };

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="Dodaj firmę">
            <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded shadow mt-4">
                <header className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-800">Dodaj nową firmę</h1>

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
                        {currentStep === 1 && "Krok 1: Dane firmy - Wpisz NIP firmy, a dane zostaną pobrane automatycznie"}
                        {currentStep === 2 && "Krok 2: Szczegóły pracy - Podaj okres zatrudnienia i stanowisko"}
                        {currentStep === 3 && "Krok 3: Podsumowanie - Sprawdź dane przed zapisaniem"}
                    </div>
                </header>

                <form onSubmit={submit} className="space-y-6">
                    {/* Panel 1 - Dane firmy */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    NIP <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.nip}
                                        onChange={handleNipChange}
                                        placeholder="Wpisz 10-cyfrowy NIP"
                                        maxLength={10}
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                            errors.nip || nipError ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {loading && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
                                        </div>
                                    )}
                                </div>
                                {data.nip && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        Formatowany: {formatNip(data.nip)}
                                    </div>
                                )}
                                {errors.nip && <div className="text-xs text-red-600 mt-1">{errors.nip}</div>}
                                {nipError && <div className="text-xs text-red-600 mt-1">{nipError}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nazwa firmy <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        errors.name ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pełny adres</label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={2}
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        errors.address ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.address && <div className="text-xs text-red-600 mt-1">{errors.address}</div>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ulica</label>
                                    <input
                                        type="text"
                                        value={data.street}
                                        onChange={(e) => setData('street', e.target.value)}
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                            errors.street ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.street && <div className="text-xs text-red-600 mt-1">{errors.street}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kod pocztowy</label>
                                    <input
                                        type="text"
                                        value={data.zip}
                                        onChange={(e) => setData('zip', e.target.value)}
                                        placeholder="00-000"
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                            errors.zip ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.zip && <div className="text-xs text-red-600 mt-1">{errors.zip}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Miasto</label>
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                            errors.city ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.city && <div className="text-xs text-red-600 mt-1">{errors.city}</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Panel 2 - Czas pracy i stanowisko */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Data rozpoczęcia pracy <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.workStartDate}
                                    onChange={(e) => setData('workStartDate', e.target.value)}
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        errors.workStartDate ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.workStartDate && <div className="text-xs text-red-600 mt-1">{errors.workStartDate}</div>}
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="currentlyWorking"
                                    name="currentlyWorking"
                                    type="checkbox"
                                    checked={currentlyWorking}
                                    onChange={(e) => handleCurrentlyWorkingChange(e.target.checked)}
                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                />
                                <label htmlFor="currentlyWorking" className="ml-2 block text-sm text-gray-700">
                                    Ciągle pracuję w tej firmie
                                </label>
                            </div>

                            {!currentlyWorking && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Data zakończenia pracy <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.workEndDate}
                                        onChange={(e) => setData('workEndDate', e.target.value)}
                                        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                            errors.workEndDate ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.workEndDate && <div className="text-xs text-red-600 mt-1">{errors.workEndDate}</div>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Stanowisko <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                    placeholder="Np. Programista, Księgowy, Menedżer"
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        errors.position ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.position && <div className="text-xs text-red-600 mt-1">{errors.position}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Opis zadań i obowiązków
                                </label>
                                <textarea
                                    value={data.jobDescription}
                                    onChange={(e) => setData('jobDescription', e.target.value)}
                                    rows={4}
                                    placeholder="Opisz główne zadania i obowiązki na tym stanowisku..."
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        errors.jobDescription ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.jobDescription && <div className="text-xs text-red-600 mt-1">{errors.jobDescription}</div>}
                            </div>

                            {!currentlyWorking && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Świadectwo pracy
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
                                                    htmlFor="workCertificate"
                                                    className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500"
                                                >
                                                    <span>Wybierz plik</span>
                                                    <input
                                                        id="workCertificate"
                                                        name="workCertificate"
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
                                            {data.workCertificate && (
                                                <p className="text-xs text-green-600 mt-2">
                                                    Wybrano: {data.workCertificate.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Załącz świadectwo pracy jeśli posiadasz
                                    </p>
                                    {errors.workCertificate && <div className="text-xs text-red-600 mt-1">{errors.workCertificate}</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Panel 3 - Podsumowanie */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Podsumowanie danych</h3>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-700">Dane firmy</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><span className="font-medium">NIP:</span> {formatNip(data.nip)}</p>
                                            <p><span className="font-medium">Nazwa:</span> {data.name}</p>
                                            {data.address && <p><span className="font-medium">Adres:</span> {data.address}</p>}
                                            {(data.street || data.zip || data.city) && (
                                                <p><span className="font-medium">Lokalizacja:</span> {[data.street, data.zip, data.city].filter(Boolean).join(', ')}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-700">Szczegóły zatrudnienia</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><span className="font-medium">Okres pracy:</span>
                                                {data.workStartDate} {currentlyWorking ? '- obecnie' : (data.workEndDate ? `- ${data.workEndDate}` : '- brak daty zakończenia')}
                                                {currentlyWorking && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktualnie zatrudniony</span>}
                                            </p>
                                            <p><span className="font-medium">Stanowisko:</span> {data.position}</p>
                                            {data.jobDescription && (
                                                <div>
                                                    <span className="font-medium">Opis zadań:</span>
                                                    <p className="mt-1 text-gray-500 italic">{data.jobDescription}</p>
                                                </div>
                                            )}
                                            {data.workCertificate && (
                                                <p><span className="font-medium">Świadectwo pracy:</span>
                                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        📄 {data.workCertificate.name}
                                                    </span>
                                                </p>
                                            )}
                                            {!data.workCertificate && !currentlyWorking && (
                                                <p><span className="font-medium">Świadectwo pracy:</span>
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
                                            <p>Upewnij się, że wszystkie dane są poprawne. Po zapisaniu będziesz mógł je edytować.</p>
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
                                onClick={() => router.get('/employee/company')}
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
                                    disabled={processing || loading}
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
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Potwierdź wysłanie</h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
                                        Czy na pewno chcesz zapisać dane firmy?
                                        Po potwierdzeniu informacje zostaną wysłane do systemu.
                                    </p>
                                    <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Podsumowanie:</p>
                                        <p className="text-xs text-gray-600">• Firma: {data.name}</p>
                                        <p className="text-xs text-gray-600">• NIP: {formatNip(data.nip)}</p>
                                        <p className="text-xs text-gray-600">• Stanowisko: {data.position}</p>
                                        <p className="text-xs text-gray-600">• Status: {currentlyWorking ? 'Aktualnie zatrudniony' : 'Poprzednie zatrudnienie'}</p>
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
                                            {processing ? 'Wysyłanie...' : 'Tak, wyślij'}
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

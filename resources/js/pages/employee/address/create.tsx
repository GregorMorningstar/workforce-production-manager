import React, { useState } from 'react';
import { usePage, useForm, Link } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, User, Phone, CreditCard, MapPin, Calendar, Heart, Camera, ChevronRight, ChevronLeft, Eye, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface FormData {
    phone: string;
    pesel: string;
    address: string;
    profile_photo: File | null;
    birth_date: string;
    gender: 'male' | 'female' | 'other' | '';
    emergency_contact_name: string;
    emergency_contact_phone: string;
}

export default function ProfileCreate() {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user;
    const [currentStep, setCurrentStep] = useState(1);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const totalSteps = 3;

    const breadcrumbs = [
        { label: 'Panel Pracownika', href: '/employee/dashboard' },
        { label: 'Mój profil', href: '/employee/profile' },
        { label: 'Uzupełnij profil' },
    ];

    const { data, setData, post, processing, errors } = useForm<FormData>({
        phone: '',
        pesel: '',
        address: '',
        profile_photo: null,
        birth_date: '',
        gender: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
    });

    const steps = [
        { number: 1, title: 'Dane osobowe', description: 'Podstawowe informacje' },
        { number: 2, title: 'Dodatkowe dane', description: 'Zdjęcie i kontakt awaryjny' },
        { number: 3, title: 'Podgląd', description: 'Sprawdź i wyślij' }
    ];

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(
                    data.phone && validatePhone(data.phone) &&
                    data.pesel && validatePesel(data.pesel) &&
                    data.address &&
                    data.birth_date
                );
            case 2:
                return true;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps && validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const getStepStatus = (stepNumber: number) => {
        if (stepNumber < currentStep) return 'completed';
        if (stepNumber === currentStep) return 'current';
        return 'upcoming';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmation(true);
    };

    const handleConfirmSubmit = () => {
        setShowConfirmation(false);
        post('/employee/adress', {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const validation = validateImage(file);
            if (!validation.isValid) {
                alert(validation.message);
                e.target.value = '';
                setData('profile_photo', null);
                return;
            }
        }

        setData('profile_photo', file);
    };

    const formatPesel = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        return numericValue.substring(0, 11);
    };

    const formatPhone = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        return numericValue.substring(0, 15);
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^\d{9,15}$/;
        return phoneRegex.test(phone);
    };

    const validatePesel = (pesel: string): boolean => {
        if (pesel.length !== 11) return false;

        const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
        let sum = 0;

        for (let i = 0; i < 10; i++) {
            sum += parseInt(pesel[i]) * weights[i];
        }

        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(pesel[10]);
    };

    const validateImage = (file: File): { isValid: boolean; message: string } => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            return { isValid: false, message: 'Dozwolone są tylko pliki JPG i PNG' };
        }

        if (file.size > maxSize) {
            return { isValid: false, message: 'Rozmiar pliku nie może przekraczać 10MB' };
        }

        return { isValid: true, message: '' };
    };

    return (
        <EmployeeLayout title="Uzupełnij profil" breadcrumbs={breadcrumbs}>
            <div className="max-w-4xl mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/employee/profile">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Powrót
                        </Button>
                    </Link>
                    <div>
                        <p className="text-gray-600 mt-1">Krok {currentStep} z {totalSteps}</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const status = getStepStatus(step.number);
                                return (
                                    <div key={step.number} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div className={`
                                                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                                                ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                                                  status === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                                                  'bg-gray-100 border-gray-300 text-gray-600'}
                                            `}>
                                                {status === 'completed' ? (
                                                    <Check className="w-5 h-5" />
                                                ) : (
                                                    <span className="font-medium">{step.number}</span>
                                                )}
                                            </div>
                                            <div className="mt-2 text-center">
                                                <p className={`text-sm font-medium ${
                                                    status === 'current' ? 'text-blue-600' : 'text-gray-600'
                                                }`}>
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-gray-500">{step.description}</p>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`w-24 h-0.5 mx-4 ${
                                                status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                            }`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>



                {/* Step Content */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Dane osobowe
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="phone">Numer telefonu *</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', formatPhone(e.target.value))}
                                                    placeholder="123456789"
                                                    className={`pl-10 ${
                                                        errors.phone || (data.phone && !validatePhone(data.phone))
                                                        ? 'border-red-500' :
                                                        data.phone && validatePhone(data.phone) ? 'border-green-500' : ''
                                                    }`}
                                                    maxLength={15}
                                                />
                                            </div>
                                            {errors.phone && (
                                                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                                            )}
                                            {data.phone && !validatePhone(data.phone) && (
                                                <p className="text-sm text-red-600 mt-1">Wprowadź poprawny numer telefonu (9-15 cyfr)</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="pesel">PESEL *</Label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    id="pesel"
                                                    type="text"
                                                    value={data.pesel}
                                                    onChange={(e) => setData('pesel', formatPesel(e.target.value))}
                                                    placeholder="12345678901"
                                                    className={`pl-10 ${
                                                        errors.pesel || (data.pesel && !validatePesel(data.pesel))
                                                        ? 'border-red-500' :
                                                        data.pesel && validatePesel(data.pesel) ? 'border-green-500' : ''
                                                    }`}
                                                    maxLength={11}
                                                />
                                            </div>
                                            {errors.pesel && (
                                                <p className="text-sm text-red-600 mt-1">{errors.pesel}</p>
                                            )}
                                            {data.pesel && !validatePesel(data.pesel) && (
                                                <p className="text-sm text-red-600 mt-1">Wprowadź poprawny numer PESEL (11 cyfr z poprawną cyfrą kontrolną)</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="birth_date">Data urodzenia *</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    id="birth_date"
                                                    type="date"
                                                    value={data.birth_date}
                                                    onChange={(e) => setData('birth_date', e.target.value)}
                                                    className={`pl-10 ${errors.birth_date ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                            {errors.birth_date && (
                                                <p className="text-sm text-red-600 mt-1">{errors.birth_date}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="gender">Płeć</Label>
                                            <Select
                                                value={data.gender}
                                                onValueChange={(value) => setData('gender', value as 'male' | 'female' | 'other')}
                                            >
                                                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Wybierz płeć" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Mężczyzna</SelectItem>
                                                    <SelectItem value="female">Kobieta</SelectItem>
                                                    <SelectItem value="other">Inna</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gender && (
                                                <p className="text-sm text-red-600 mt-1">{errors.gender}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Adres zamieszkania
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <Label htmlFor="address">Pełny adres *</Label>
                                        <Textarea
                                            id="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="ul. Przykładowa 12/34&#10;00-123 Warszawa&#10;Polska"
                                            rows={3}
                                            className={errors.address ? 'border-red-500' : ''}
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Wprowadź pełny adres zamieszkania (ulica, kod pocztowy, miasto, kraj)
                                        </p>
                                        {errors.address && (
                                            <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Step 2: Profile Photo & Emergency Contact */}
                    {currentStep === 2 && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Camera className="w-5 h-5" />
                                        Zdjęcie profilowe
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <Label htmlFor="profile_photo">Zdjęcie profilowe</Label>
                                        <Input
                                            id="profile_photo"
                                            type="file"
                                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                            onChange={handleFileChange}
                                            className={errors.profile_photo ? 'border-red-500' : ''}
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Dopuszczalne formaty: <strong>JPG, PNG</strong> (max 2MB)
                                        </p>
                                        {errors.profile_photo && (
                                            <p className="text-sm text-red-600 mt-1">{errors.profile_photo}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Heart className="w-5 h-5" />
                                        Kontakt awaryjny
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="emergency_contact_name">Imię i nazwisko</Label>
                                            <Input
                                                id="emergency_contact_name"
                                                type="text"
                                                value={data.emergency_contact_name}
                                                onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                                placeholder="Jan Kowalski"
                                                className={errors.emergency_contact_name ? 'border-red-500' : ''}
                                            />
                                            {errors.emergency_contact_name && (
                                                <p className="text-sm text-red-600 mt-1">{errors.emergency_contact_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="emergency_contact_phone">Numer telefonu</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    id="emergency_contact_phone"
                                                    type="tel"
                                                    value={data.emergency_contact_phone}
                                                    onChange={(e) => setData('emergency_contact_phone', formatPhone(e.target.value))}
                                                    placeholder="123456789"
                                                    className={`pl-10 ${
                                                        errors.emergency_contact_phone ||
                                                        (data.emergency_contact_phone && !validatePhone(data.emergency_contact_phone))
                                                        ? 'border-red-500' :
                                                        data.emergency_contact_phone && validatePhone(data.emergency_contact_phone) ? 'border-green-500' : ''
                                                    }`}
                                                    maxLength={15}
                                                />
                                            </div>
                                            {errors.emergency_contact_phone && (
                                                <p className="text-sm text-red-600 mt-1">{errors.emergency_contact_phone}</p>
                                            )}
                                            {data.emergency_contact_phone && !validatePhone(data.emergency_contact_phone) && (
                                                <p className="text-sm text-red-600 mt-1">Wprowadź poprawny numer telefonu (9-15 cyfr)</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Podaj dane osoby, z którą możemy się skontaktować w przypadku nagłej sytuacji.
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Step 3: Preview */}
                    {currentStep === 3 && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="w-5 h-5" />
                                        Podgląd danych
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Alert>
                                        <Check className="h-4 w-4" />
                                        <AlertDescription>
                                            Sprawdź wprowadzone dane przed zapisaniem. Po zatwierdzeniu profil zostanie utworzony.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                Dane osobowe
                                            </h3>
                                            <div className="space-y-2 pl-6">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Telefon:</span>
                                                    <span className="font-medium">{data.phone || '(nie podano)'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">PESEL:</span>
                                                    <span className="font-medium">{data.pesel || '(nie podano)'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Data urodzenia:</span>
                                                    <span className="font-medium">{data.birth_date || '(nie podano)'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Płeć:</span>
                                                    <span className="font-medium">
                                                        {data.gender === 'male' ? 'Mężczyzna' :
                                                         data.gender === 'female' ? 'Kobieta' :
                                                         data.gender === 'other' ? 'Inna' : '(nie podano)'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Adres zamieszkania
                                            </h3>
                                            <div className="pl-6">
                                                <div className="bg-gray-50 p-3 rounded-md">
                                                    <pre className="text-sm whitespace-pre-wrap">
                                                        {data.address || '(nie podano)'}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Camera className="w-4 h-4" />
                                                Zdjęcie profilowe
                                            </h3>
                                            <div className="pl-6">
                                                <Badge variant={data.profile_photo ? "secondary" : "outline"}>
                                                    {data.profile_photo ? data.profile_photo.name : 'Nie dodano zdjęcia'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Heart className="w-4 h-4" />
                                                Kontakt awaryjny
                                            </h3>
                                            <div className="space-y-2 pl-6">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Imię i nazwisko:</span>
                                                    <span className="font-medium">{data.emergency_contact_name || '(nie podano)'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Telefon:</span>
                                                    <span className="font-medium">{data.emergency_contact_phone || '(nie podano)'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Navigation Buttons */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between">
                                <div>
                                    {currentStep > 1 && (
                                        <Button type="button" variant="outline" onClick={prevStep} disabled={processing}>
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Poprzedni krok
                                        </Button>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <Link href="/employee/profile">
                                        <Button variant="outline" type="button" disabled={processing}>
                                            Anuluj
                                        </Button>
                                    </Link>

                                    {currentStep < totalSteps ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={!validateStep(currentStep) || processing}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Następny krok
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => setShowConfirmation(true)}
                                            disabled={processing}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Potwierdź i wyślij
                                            <Check className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Potwierdź zapisanie profilu</h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
                                        Czy na pewno chcesz zapisać dane profilu?
                                        Po potwierdzeniu informacje zostaną wysłane do systemu.
                                    </p>
                                    <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Podsumowanie:</p>
                                        <p className="text-xs text-gray-600">• Telefon: {data.phone}</p>
                                        <p className="text-xs text-gray-600">• PESEL: {data.pesel}</p>
                                        <p className="text-xs text-gray-600">• Data urodzenia: {data.birth_date}</p>
                                        <p className="text-xs text-gray-600">• Płeć: {data.gender === 'male' ? 'Mężczyzna' : data.gender === 'female' ? 'Kobieta' : data.gender === 'other' ? 'Inna' : 'Nie podano'}</p>
                                        <p className="text-xs text-gray-600">• Adres: {data.address}</p>
                                        {data.emergency_contact_name && (
                                            <p className="text-xs text-gray-600">• Kontakt awaryjny: {data.emergency_contact_name} ({data.emergency_contact_phone})</p>
                                        )}
                                        {data.profile_photo && (
                                            <p className="text-xs text-gray-600">• Zdjęcie profilowe: {data.profile_photo.name}</p>
                                        )}
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
                                            onClick={handleConfirmSubmit}
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

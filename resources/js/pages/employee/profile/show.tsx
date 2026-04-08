import React from 'react';
import { usePage, Link } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Edit, MapPin, AlertCircle, Plus, CheckCircle, X } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface ProfileStatus {
    education_completed: boolean;
    work_time_completed: boolean;
    address_completed: boolean;
    overall_completion: number;
}

interface PageProps {
    auth: {
        user: User;
    };
    profileComplete: boolean;
    profileStatus: ProfileStatus | null;
    [key: string]: any;
}

export default function EmployeeShowProfile() {
    const { auth, profileComplete, profileStatus } = usePage<PageProps>().props;
    const user = auth.user;

    const breadcrumbs = [
        { label: 'Panel Pracownika', href: '/employee/dashboard' },
        { label: 'Mój profil' },
    ];

    const getStatusIcon = (completed: boolean) => {
        return completed ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
            <X className="w-5 h-5 text-red-500" />
        );
    };

    const getStatusText = (completed: boolean) => {
        return completed ? 'Ukończone' : 'Do uzupełnienia';
    };

    const getStatusBadge = (completed: boolean) => {
        return completed ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                Ukończone
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                Niekompletne
            </Badge>
        );
    };

    return (
        <EmployeeLayout title="Mój profil" breadcrumbs={breadcrumbs}>
            <div className="max-w-4xl mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mój Profil</h1>
                        <p className="text-gray-600 mt-1">Przegląd stanu twojego profilu</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/employee/adress/create">
                            <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Edytuj profil
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Overall Completion Status */}
                {profileStatus && (
                    <Card className={`border-l-4 ${profileComplete ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {profileComplete ? (
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                    )}
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {profileComplete ? 'Profil kompletny' : 'Profil wymaga uzupełnienia'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Twój profil jest ukończony w {profileStatus.overall_completion}%
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {profileStatus.overall_completion}%
                                    </div>
                                    {getStatusBadge(profileComplete)}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            profileComplete ? 'bg-green-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${profileStatus.overall_completion}%` }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Profile Sections Status */}
                {profileStatus && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Education Section */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-base">
                                    <span className="flex items-center gap-2">
                                        {getStatusIcon(profileStatus.education_completed)}
                                        Edukacja
                                    </span>
                                    {getStatusBadge(profileStatus.education_completed)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-3">
                                    {getStatusText(profileStatus.education_completed)}
                                </p>
                                {!profileStatus.education_completed && (
                                    <Link href="/employee/education/create">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Uzupełnij edukację
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* Work Time Section */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-base">
                                    <span className="flex items-center gap-2">
                                        {getStatusIcon(profileStatus.work_time_completed)}
                                        Czas pracy
                                    </span>
                                    {getStatusBadge(profileStatus.work_time_completed)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-3">
                                    {getStatusText(profileStatus.work_time_completed)}
                                </p>
                                {!profileStatus.work_time_completed && (
                                    <Link href="/employee/company/create">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Uzupełnij czas pracy
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* Address Section */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-base">
                                    <span className="flex items-center gap-2">
                                        {getStatusIcon(profileStatus.address_completed)}
                                        Adres
                                    </span>
                                    {getStatusBadge(profileStatus.address_completed)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-3">
                                    {getStatusText(profileStatus.address_completed)}
                                </p>
                                {!profileStatus.address_completed ? (
                                    <Link href="/employee/adress/create">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Dodaj adres
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/employee/adress">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Zobacz adresy
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Quick Actions */}
                {!profileComplete && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Uzupełnij swój profil</strong> - kompletny profil pomoże nam lepiej dostosować system do Twoich potrzeb.
                            {profileStatus && !profileStatus.address_completed && (
                                <span>
                                    {' '}Zacznij od{' '}
                                    <Link href="/employee/adress/create" className="font-medium text-blue-600 hover:text-blue-800">
                                        dodania adresu zamieszkania
                                    </Link>
                                    .
                                </span>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Informacje o użytkowniku
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Imię i nazwisko:</span>
                                <span className="font-medium">{user.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{user.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Rola:</span>
                                <Badge variant="secondary">
                                    {user.role === 'employee' ? 'Pracownik' : user.role}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </EmployeeLayout>
    );
}

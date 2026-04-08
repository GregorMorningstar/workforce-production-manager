import { useForm, router, usePage } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
import { Save, Upload, X, ImageIcon } from "lucide-react";

type Department = { id: number; name: string };
type User = { id: number; name: string };
type Machine = {
    id: number;
    name?: string;
    model?: string;
    serial_number?: string;
    barcode?: string;
    year_of_production?: number;
    description?: string;
    status?: string;
    department_id?: number;
    user_id?: number;
    image_path?: string;
    last_failure_date?: string;
};

export default function EditMachineCard() {
    const page = usePage() as any;
    const machine: Machine = page.props.machine;
    const departments: Department[] = page.props.departments ?? [];
    const users: User[] = page.props.users ?? [];

    const STATUS_LABELS: Record<string, string> = {
        active: "Aktywna",
        inactive: "Nieaktywna",
        maintenance: "Konserwacja",
        decommissioned: "Wycofana",
        working: "W pracy",
        forced_downtime: "Wymuszony przestój",
        breakdown: "Awaria",
    };

    const statuses: { value: string; label: string }[] = (page.props.machine_statuses ?? Object.keys(STATUS_LABELS)).map((s: any) => {
        const value = typeof s === "string" ? s : s.value ?? String(s);
        return { value, label: STATUS_LABELS[value] ?? (typeof s === "string" ? value : s.label ?? value) };
    });

    const form = useForm({
        name: machine.name ?? "",
        model: machine.model ?? "",
        serial_number: machine.serial_number ?? "",
        year_of_production: machine.year_of_production ? String(machine.year_of_production) : "",
        description: machine.description ?? "",
        status: machine.status ?? "inactive",
        department_id: machine.department_id ? String(machine.department_id) : "",
        user_id: machine.user_id ? String(machine.user_id) : "",
        image: null as File | null,
        image_path: machine.image_path ?? "",
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(
        machine.image_path ? `/storage/${machine.image_path}` : null
    );

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!form.data.name.trim()) {
            errors.name = "Nazwa maszyny jest wymagana";
        }

        if (!form.data.serial_number.trim()) {
            errors.serial_number = "Numer seryjny jest wymagany";
        }

        if (!form.data.status) {
            errors.status = "Status jest wymagany";
        }

        if (form.data.year_of_production && (isNaN(Number(form.data.year_of_production)) || Number(form.data.year_of_production) < 1900)) {
            errors.year_of_production = "Rok produkcji musi być liczbą większą niż 1900";
        }

        setClientErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData = new FormData();
        Object.entries(form.data).forEach(([key, value]) => {
            if (key === 'image' && value === null) return;
            if (value !== null && value !== undefined) {
                formData.append(key, value as string | Blob);
            }
        });

        // Add _method for Laravel PUT request
        formData.append('_method', 'PUT');

        router.post(`/moderator/machines/${machine.id}`, formData, {
            onSuccess: () => {
                alert('Maszyna została zaktualizowana!');
                router.visit('/moderator/machines');
            },
            onError: (errors) => {
                console.error('Errors:', errors);
                setClientErrors(errors as Record<string, string>);
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setClientErrors(prev => ({ ...prev, image: "Plik nie może być większy niż 5MB" }));
                return;
            }

            if (!file.type.startsWith('image/')) {
                setClientErrors(prev => ({ ...prev, image: "Plik musi być obrazem" }));
                return;
            }

            form.setData('image', file);

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            setClientErrors(prev => {
                const { image, ...rest } = prev;
                return rest;
            });
        }
    };

    const removeImage = () => {
        form.setData('image', null);
        setImagePreview(machine.image_path ? `/storage/${machine.image_path}` : null);
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleCancel = () => {
        router.visit('/moderator/machines');
    };

    useEffect(() => {
        if (form.recentlySuccessful) {
            const t = setTimeout(() => {
                router.visit('/moderator/machines');
            }, 1200);
            return () => clearTimeout(t);
        }
    }, [form.recentlySuccessful]);

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Edytuj maszynę</h2>
                    <button
                        onClick={handleCancel}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {form.recentlySuccessful && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800">Maszyna została pomyślnie zaktualizowana!</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nazwa */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nazwa maszyny *
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    clientErrors.name || form.errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Wprowadź nazwę maszyny"
                            />
                            {(clientErrors.name || form.errors.name) && (
                                <p className="mt-1 text-sm text-red-600">{clientErrors.name || form.errors.name}</p>
                            )}
                        </div>

                        {/* Model */}
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                                Model
                            </label>
                            <input
                                type="text"
                                id="model"
                                value={form.data.model}
                                onChange={(e) => form.setData('model', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Wprowadź model maszyny"
                            />
                        </div>

                        {/* Numer seryjny */}
                        <div>
                            <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 mb-1">
                                Numer seryjny *
                            </label>
                            <input
                                type="text"
                                id="serial_number"
                                value={form.data.serial_number}
                                onChange={(e) => form.setData('serial_number', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    clientErrors.serial_number || form.errors.serial_number ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Wprowadź numer seryjny"
                            />
                            {(clientErrors.serial_number || form.errors.serial_number) && (
                                <p className="mt-1 text-sm text-red-600">{clientErrors.serial_number || form.errors.serial_number}</p>
                            )}
                        </div>

                        {/* Rok produkcji */}
                        <div>
                            <label htmlFor="year_of_production" className="block text-sm font-medium text-gray-700 mb-1">
                                Rok produkcji
                            </label>
                            <input
                                type="number"
                                id="year_of_production"
                                value={form.data.year_of_production}
                                onChange={(e) => form.setData('year_of_production', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    clientErrors.year_of_production || form.errors.year_of_production ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="np. 2023"
                                min="1900"
                                max={new Date().getFullYear()}
                            />
                            {(clientErrors.year_of_production || form.errors.year_of_production) && (
                                <p className="mt-1 text-sm text-red-600">{clientErrors.year_of_production || form.errors.year_of_production}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status *
                            </label>
                            <select
                                id="status"
                                value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    clientErrors.status || form.errors.status ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            {(clientErrors.status || form.errors.status) && (
                                <p className="mt-1 text-sm text-red-600">{clientErrors.status || form.errors.status}</p>
                            )}
                        </div>

                        {/* Dział */}
                        <div>
                            <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">
                                Dział
                            </label>
                            <select
                                id="department_id"
                                value={form.data.department_id}
                                onChange={(e) => form.setData('department_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Wybierz dział</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Właściciel */}
                        <div>
                            <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                                Właściciel/Operator
                            </label>
                            <select
                                id="user_id"
                                value={form.data.user_id}
                                onChange={(e) => form.setData('user_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Wybierz użytkownika</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Opis */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Opis
                        </label>
                        <textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Dodatkowe informacje o maszynie..."
                        />
                    </div>

                    {/* Zdjęcie */}
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                            Zdjęcie maszyny
                        </label>

                        {imagePreview && (
                            <div className="mb-4 relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Podgląd"
                                    className="w-32 h-32 object-cover rounded-md border border-gray-300"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center space-x-4">
                            <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2">
                                <Upload className="w-4 h-4" />
                                <span>Wybierz plik</span>
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            {form.data.image && (
                                <span className="text-sm text-green-600">
                                    Plik wybrany: {form.data.image.name}
                                </span>
                            )}
                        </div>

                        {(clientErrors.image || form.errors.image) && (
                            <p className="mt-1 text-sm text-red-600">{clientErrors.image || form.errors.image}</p>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                            Obsługiwane formaty: JPG, PNG, GIF. Maksymalny rozmiar: 5MB
                        </p>
                    </div>

                    {/* Przyciski */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{form.processing ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

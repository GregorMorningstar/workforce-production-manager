import { useForm, router, usePage } from "@inertiajs/react";
import React, { useEffect, useState } from "react";

type Department = { id: number; name: string };
type User = { id: number; name: string };

export default function AddMachineCard() {
    const page = usePage() as any;
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
        barcode: "",
        user_id: "",
        last_failure_date: "",
        image: null as File | null,
        image_path: "",
        year_of_production: "",
        name: "",
        model: "",
        serial_number: "",
        description: "",
        department_id: "",
        status: statuses[0]?.value ?? "inactive",
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (form.recentlySuccessful) {
            const t = setTimeout(() => {
                form.reset();
            }, 1200);
            return () => clearTimeout(t);
        }
    }, [form.recentlySuccessful]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setClientErrors({});

        // prosta walidacja po stronie klienta
        const missing: string[] = [];
        if (!String(form.data.name).trim()) missing.push("name");
        if (!String(form.data.serial_number).trim()) missing.push("serial_number");

        if (missing.length) {
            const errs: Record<string, string> = {};
            missing.forEach((k) => (errs[k] = "To pole jest wymagane."));
            setClientErrors(errs);
            return;
        }

        form.post('/moderator/machines/add-new', {
            forceFormData: true,
            onSuccess: () => {
                router.get('/moderator/machines');
            },
            onError: () => {
                const firstErrorField = Object.keys(form.errors)[0];
                if (firstErrorField) {
                    const el = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement | null;
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            },
            onFinish: () => {
            },
        });
    }

    return (
        <div className="py-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Dodaj nową maszynę</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Wypełnij formularz, aby dodać maszynę do systemu.</p>

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Nazwa</label>
                            <input
                                value={form.data.name}
                                onChange={(e) => form.setData("name", e.target.value)}
                                className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                placeholder="np. Frezarka 2000"
                                aria-invalid={!!(form.errors.name || clientErrors.name)}
                                required
                            />
                            {(form.errors.name || clientErrors.name) && (
                                <div className="text-sm text-red-600 mt-1">{form.errors.name ?? clientErrors.name}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Numer seryjny</label>
                            <input
                                value={form.data.serial_number}
                                onChange={(e) => form.setData("serial_number", e.target.value)}
                                className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                placeholder="np. SN-123456"
                                required
                            />
                            {form.errors.serial_number && <div className="text-sm text-red-600 mt-1">{form.errors.serial_number}</div>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Model</label>
                                <input
                                    value={form.data.model}
                                    onChange={(e) => form.setData("model", e.target.value)}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Rok produkcji</label>
                                <input
                                    type="number"
                                    value={form.data.year_of_production}
                                    onChange={(e) => form.setData("year_of_production", e.target.value)}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Opis</label>
                            <textarea
                                value={form.data.description}
                                onChange={(e) => form.setData("description", e.target.value)}
                                className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Departament</label>
                                <select
                                    value={form.data.department_id}
                                    onChange={(e) => form.setData("department_id", e.target.value)}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                >
                                    <option value="">-- wybierz --</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Status</label>
                                <select
                                    value={form.data.status}
                                    onChange={(e) => form.setData("status", e.target.value)}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                >
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Przypisz użytkownika (opcjonalnie)</label>
                                <select
                                    value={form.data.user_id}
                                    onChange={(e) => form.setData("user_id", e.target.value)}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                >
                                    <option value="">-- brak --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Zdjęcie (upload)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                                        form.setData('image', file);
                                        if (file) {
                                            form.setData('image_path', file.name);
                                        } else {
                                            form.setData('image_path', '');
                                        }
                                    }}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                />

                                {form.data.image && (
                                    <div className="mt-2">
                                        <img
                                            src={URL.createObjectURL(form.data.image)}
                                            alt="preview"
                                            className="h-20 w-auto rounded-md object-cover border"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                            >
                                <i className="fa fa-upload" aria-hidden="true" />
                                {form.processing ? ' Zapisywanie...' : ' Dodaj maszynę'}
                            </button>

                            <div className="min-w-[8rem] text-right">
                                {form.recentlySuccessful ? (
                                    <span className="text-green-600 font-medium">Zapisano</span>
                                ) : (
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Wypełnij formularz i zapisz</span>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

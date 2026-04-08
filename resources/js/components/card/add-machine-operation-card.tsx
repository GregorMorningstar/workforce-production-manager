import React, { useState } from "react";
import { useForm } from "@inertiajs/react";

type Props = {
    initialMachineId?: number;
    machine?: {
        id: number;
        name: string;
        model?: string;
    };
};

export default function AddMachineOperationCard({ initialMachineId, machine }: Props) {
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const form = useForm({
        operation_name: "",
        description: "",
        changeover_time: "",
    });

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.data.operation_name || !form.data.operation_name.trim()) {
            e.operation_name = "Nazwa operacji jest wymagana.";
        }
        // duration_minutes removed; only validate changeover_time
        if (form.data.changeover_time && (Number.isNaN(Number(form.data.changeover_time)) || Number(form.data.changeover_time) < 0)) {
            e.changeover_time = "Czas przezbrojenia musi być liczbą >= 0.";
        }
        setClientErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setClientErrors({});

        if (!initialMachineId) {
            setClientErrors({ general: "Brak ID maszyny." });
            return;
        }

        if (!validate()) return;

        const postUrl = `/moderator/machines/operations/${initialMachineId}`;
        form.post(postUrl, {
            onError: (errors: Record<string, any>) => {
                const mapped: Record<string, string> = {};
                for (const k in errors) {
                    mapped[k] = Array.isArray(errors[k]) ? errors[k][0] : String(errors[k]);
                }
                setClientErrors(mapped);
            },
            onSuccess: () => {
                form.reset();
                setClientErrors({});
            },
        });
    };

    const errorFor = (key: string) => clientErrors[key] || (form.errors as any)[key];

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h1 className="text-2xl font-semibold mb-4">
                Dodaj operację
                {machine && <span className="text-gray-600"> do maszyny: {machine.name}</span>}
            </h1>

            {errorFor("general") && (
                <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    {errorFor("general")}
                </div>
            )}

            <form onSubmit={submit} noValidate className="space-y-4">
                <div>
                    <label htmlFor="operation_name" className="block font-medium text-gray-700 mb-2">
                        Nazwa operacji *
                    </label>
                    <input
                        id="operation_name"
                        name="operation_name"
                        type="text"
                        value={form.data.operation_name}
                        onChange={e => form.setData("operation_name", e.target.value)}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                            errorFor("operation_name") ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Np. Toczenie, Frezowanie, Wiercenie"
                        required
                    />
                    {errorFor("operation_name") && (
                        <div className="text-red-600 text-sm mt-1">{errorFor("operation_name")}</div>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className="block font-medium text-gray-700 mb-2">
                        Opis
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.data.description}
                        onChange={e => form.setData("description", e.target.value)}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                            errorFor("description") ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows={3}
                        placeholder="Opcjonalny opis operacji"
                    />
                    {errorFor("description") && (
                        <div className="text-red-600 text-sm mt-1">{errorFor("description")}</div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="changeover_time" className="block font-medium text-gray-700 mb-2">
                            Czas przezbrojenia (min)
                        </label>
                        <input
                            id="changeover_time"
                            name="changeover_time"
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.data.changeover_time}
                            onChange={e => form.setData("changeover_time", e.target.value)}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                errorFor("changeover_time") ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                        />
                        {errorFor("changeover_time") && (
                            <div className="text-red-600 text-sm mt-1">{errorFor("changeover_time")}</div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={form.processing}
                    >
                        {form.processing ? "Zapisywanie..." : "Zapisz operację"}
                    </button>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Anuluj
                    </button>
                </div>
            </form>
        </div>
    );
}

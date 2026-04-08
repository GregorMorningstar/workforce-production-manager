import React, { useState, useEffect } from "react";
import axios from "axios";

interface MaterialGroupOption {
    value: string;
    label: string;
}

interface MaterialFormOption {
    value: string;
    label: string;
}

export default function ToAddMaterials() {
    const [materialGroups, setMaterialGroups] = useState<MaterialGroupOption[]>([]);
    const [materialForms, setMaterialForms] = useState<MaterialFormOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        group_material: '',
        material_form: '',
        delivery_number: '',
        stock_empty_alarm: '0',
        available_quantity: '0',
    });

    const [deliveryScan, setDeliveryScan] = useState<File | null>(null);
    const [scanPreview, setScanPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchEnums();
    }, []);

    const fetchEnums = async () => {
        try {
            const response = await axios.get('/moderator/production-materials/create');
            setMaterialGroups(response.data.materialGroups);
            setMaterialForms(response.data.materialForms);
        } catch (error) {
            console.error('Error fetching enums:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDeliveryScan(file);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setScanPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setScanPreview(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const formDataToSend = new FormData();

            // Append all form fields
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            // Append file
            if (deliveryScan) {
                formDataToSend.append('delivery_scan', deliveryScan);
            }

            const response = await axios.post('/moderator/production-materials', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                // Reset form
                setFormData({
                    name: '',
                    description: '',
                    group_material: '',
                    material_form: '',
                    delivery_number: '',
                    stock_empty_alarm: '0',
                    available_quantity: '0',
                });
                setDeliveryScan(null);
                setScanPreview(null);
            } else {
                setMessage({ type: 'error', text: response.data.message });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Wystąpił błąd podczas dodawania materiału.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="font-semibold mb-4 text-lg">Dodaj nowy materiał do magazynu</h2>

            {message && (
                <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nazwa */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Nazwa <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            required
                        />
                    </div>

                    {/* Grupa materiału */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Grupa materiału <span className="text-red-600">*</span>
                        </label>
                        <select
                            name="group_material"
                            value={formData.group_material}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            required
                        >
                            <option value="">Wybierz grupę</option>
                            {materialGroups.map((g) => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Typ materiału */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Typ materiału <span className="text-red-600">*</span>
                        </label>
                        <select
                            name="material_form"
                            value={formData.material_form}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            required
                        >
                            <option value="">Wybierz typ</option>
                            {materialForms.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Scan dostawy */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Scan dostawy (JPG, PNG, PDF) <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="file"
                            name="delivery_scan"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="w-full border px-3 py-2 rounded"
                            required
                        />
                        {scanPreview && (
                            <div className="mt-2">
                                <img src={scanPreview} alt="Podgląd" className="max-w-xs h-auto border rounded" />
                            </div>
                        )}
                        {deliveryScan && !scanPreview && (
                            <div className="mt-2 text-sm text-gray-600">
                                Wybrano plik: {deliveryScan.name} ({(deliveryScan.size / 1024).toFixed(2)} KB)
                            </div>
                        )}
                    </div>

                    {/* Numer zamówienia */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Numer dostawy <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            name="delivery_number"
                            value={formData.delivery_number}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            required
                        />
                    </div>

                    {/* Dostępna ilość */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Dostępna ilość
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="available_quantity"
                            value={formData.available_quantity}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                        />
                    </div>

                    {/* Alarm przy niskim stanie */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Alarm przy niskim stanie
                        </label>
                        <input
                            type="number"
                            min="0"
                            name="stock_empty_alarm"
                            value={formData.stock_empty_alarm}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                        />
                    </div>

                    {/* Opis */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Opis
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border px-3 py-2 rounded"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Dodawanie...' : 'Dodaj materiał'}
                    </button>
                </div>
            </form>
        </div>
    );
}

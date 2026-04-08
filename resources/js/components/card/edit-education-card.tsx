import React, { useEffect, useState } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import { Save, Upload, X, FileText } from "lucide-react";

type Education = {
  id?: number;
  school_name?: string;
  school_address?: string;
  start_year?: number | string;
  end_year?: number | string | null;
  education_level?: string;
  field_of_study?: string | null;
  certificate_path?: string | null;
};

export default function EditEducationCard() {
  const page = usePage() as any;
  const education: Education = page.props.education ?? {};

  const form = useForm({
    school_name: String(education.school_name ?? ""),
    school_address: String(education.school_address ?? ""),
    start_year: education.start_year ? String(education.start_year) : "",
    end_year: education.end_year ? String(education.end_year) : "",
    education_level: String(education.education_level ?? ""),
    field_of_study: String(education.field_of_study ?? ""),
    certificate: null as File | null,
    certificate_path: String(education.certificate_path ?? ""),
  });

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string | null>(education.certificate_path ? education.certificate_path.split("/").pop() : null);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.data.school_name.trim()) errors.school_name = "Nazwa szkoły jest wymagana";
    if (!form.data.start_year.trim()) errors.start_year = "Rok rozpoczęcia jest wymagany";
    if (!form.data.education_level.trim()) errors.education_level = "Poziom wykształcenia jest wymagany";

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      form.setData("certificate", null);
      setFileName(null);
      return;
    }

    const max = 10 * 1024 * 1024; // 10MB
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    if (file.size > max) {
      setClientErrors(prev => ({ ...prev, certificate: "Plik nie może być większy niż 10MB" }));
      return;
    }

    if (!allowed.includes(file.type)) {
      setClientErrors(prev => ({ ...prev, certificate: "Niedozwolony typ pliku" }));
      return;
    }

    form.setData("certificate", file);
    setFileName(file.name);
    setClientErrors(prev => {
      const { certificate, ...rest } = prev;
      return rest;
    });
  };

  const removeFile = () => {
    form.setData("certificate", null);
    setFileName(null);
    const input = document.getElementById("certificate") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleCancel = () => {
    router.visit("/employee/adress/all");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    Object.entries(form.data).forEach(([k, v]) => {
      if (k === "certificate" && v === null) return;
      if (v !== null && v !== undefined) fd.append(k, v as any);
    });

    // if editing
    if (education.id) fd.append("_method", "PUT");

    const url = education.id ? `/employee/education/${education.id}` : "/employee/education";
    router.post(url, fd, {
      onSuccess: () => {
        router.visit("/employee/adress/all");
      },
      onError: (errors) => {
        setClientErrors(errors as Record<string, string>);
      },
    });
  };

  useEffect(() => {
    if (form.recentlySuccessful) {
      const t = setTimeout(() => router.visit("/employee/adress/all"), 800);
      return () => clearTimeout(t);
    }
  }, [form.recentlySuccessful]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Formularz edukacji</h2>
          <button onClick={handleCancel} className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {form.recentlySuccessful && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">Dane zostały zapisane.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa szkoły *</label>
              <input
                type="text"
                value={form.data.school_name}
                onChange={(e) => form.setData("school_name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${clientErrors.school_name || form.errors.school_name ? "border-red-300" : "border-gray-300"}`}
                placeholder="np. Technikum"
              />
              {(clientErrors.school_name || form.errors.school_name) && <p className="mt-1 text-sm text-red-600">{clientErrors.school_name || form.errors.school_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres szkoły</label>
              <input
                type="text"
                value={form.data.school_address}
                onChange={(e) => form.setData("school_address", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="ul. ... "
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poziom *</label>
              <input
                type="text"
                value={form.data.education_level}
                onChange={(e) => form.setData("education_level", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${clientErrors.education_level || form.errors.education_level ? "border-red-300" : "border-gray-300"}`}
                placeholder="np. średnie, inżynier"
              />
              {(clientErrors.education_level || form.errors.education_level) && <p className="mt-1 text-sm text-red-600">{clientErrors.education_level || form.errors.education_level}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kierunek</label>
              <input
                type="text"
                value={form.data.field_of_study}
                onChange={(e) => form.setData("field_of_study", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="np. Mechanika"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rok rozpoczęcia *</label>
              <input
                type="number"
                value={form.data.start_year}
                onChange={(e) => form.setData("start_year", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${clientErrors.start_year || form.errors.start_year ? "border-red-300" : "border-gray-300"}`}
                placeholder="YYYY"
              />
              {(clientErrors.start_year || form.errors.start_year) && <p className="mt-1 text-sm text-red-600">{clientErrors.start_year || form.errors.start_year}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rok zakończenia</label>
              <input
                type="number"
                value={form.data.end_year}
                onChange={(e) => form.setData("end_year", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="YYYY lub puste"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certyfikat (PDF/JPG/PNG/DOC/DOCX)</label>

            {fileName && (
              <div className="mb-2 flex items-center gap-3">
                <a href={education.certificate_path ? `/storage/${education.certificate_path}` : "#"} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline flex items-center gap-2">
                  <FileText className="w-4 h-4" /> {fileName}
                </a>
                <button type="button" onClick={removeFile} className="text-sm text-red-600 hover:underline">Usuń</button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Wybierz plik</span>
                <input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} className="hidden" />
              </label>

              {form.data.certificate && <span className="text-sm text-green-600">Plik: {form.data.certificate.name}</span>}
            </div>

            {(clientErrors.certificate || form.errors.certificate) && <p className="mt-1 text-sm text-red-600">{clientErrors.certificate || form.errors.certificate}</p>}

            <p className="text-xs text-gray-500 mt-2">Maksymalny rozmiar 10MB. Obsługiwane: PDF, JPG, PNG, DOC, DOCX.</p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button type="button" onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Anuluj</button>
            <button type="submit" disabled={form.processing} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>{form.processing ? "Zapisywanie..." : "Zapisz"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

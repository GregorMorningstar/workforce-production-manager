import React from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import ModeratorDepartmentNavMenu from '@/components/menu/moderator-department-nav-menu';
export default function ModeratorDepartmentEdit({ department }: any) {
  const { data, setData, put, processing, errors } = useForm<{ name: string; description: string; location: string }>({
    name: department?.name ?? '',
    description: department?.description ?? '',
    location: department?.location ?? '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/moderator/departments/${department.id}`, {
      onSuccess: () => {},
    });
  };

  const handleDelete = () => {
    if (!confirm(`Czy na pewno usunąć dział "${department?.name}"?`)) return;
    router.delete(`/moderator/departments/${department.id}`);
  };

  return (

    <ModeratorLayout >
        <ModeratorDepartmentNavMenu />
 <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded shadow">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Edytuj dział</h1>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nazwa</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Opis</label>
          <textarea
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
            rows={4}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.description ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors.description && <div className="text-xs text-red-600 mt-1">{errors.description}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lokalizacja</label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => setData('location', e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.location ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors.location && <div className="text-xs text-red-600 mt-1">{errors.location}</div>}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={processing}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60"
          >
            Zapisz
          </button>

          <Link href="/moderator/departments" className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">
            Anuluj
          </Link>

          <button type="button" onClick={handleDelete} className="ml-auto px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
            Usuń dział
          </button>
        </div>
      </form>
    </div>
    </ModeratorLayout>

  );
}

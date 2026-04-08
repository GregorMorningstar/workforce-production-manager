import DepartamentCardSimple from "@/components/card/departamentCardSimple";
import ModeratorDepartmentNavMenu from "@/components/menu/moderator-department-nav-menu";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, Link as InertiaLink, router } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function DepartmentsIndex() {
    const breadcrumbs = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Działy', href: '/moderator/departments' }
    ];

    const page = usePage();
    const props = page.props as any;
    const success = props.success as string | undefined;
    const error = props.error as string | undefined;
    const departmentId = props.department_id ?? props.departmentId ?? null;

    const [showSuccess, setShowSuccess] = useState<boolean>(Boolean(success));
    const [showError, setShowError] = useState<boolean>(Boolean(error));

    useEffect(() => {
      setShowSuccess(Boolean(success));
      if (success) {
        const t = setTimeout(() => setShowSuccess(false), 5000);
        return () => clearTimeout(t);
      }
    }, [success]);

    useEffect(() => {
      setShowError(Boolean(error));
      if (error) {
        const t = setTimeout(() => setShowError(false), 5000);
        return () => clearTimeout(t);
      }
    }, [error]);

    const raw = props.departaments ?? props.departments ?? [];
    const isServerPaginator = raw && !Array.isArray(raw) && !!raw.data;
    const items: any[] = isServerPaginator ? (raw.data ?? []) : (Array.isArray(raw) ? raw : []);

    const PER_PAGE = 6;
    const [pageIndex, setPageIndex] = useState<number>(1);
    const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    const clientPagedItems = items.slice((pageIndex - 1) * PER_PAGE, pageIndex * PER_PAGE);

    const displayedItems = isServerPaginator ? items : clientPagedItems;

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Działy">
            <ModeratorDepartmentNavMenu />
            {showSuccess && success && (
              <div className="mx-4 my-4">
                <div className="relative rounded-md bg-green-50 p-3 text-green-800 border border-green-100">
                  <button
                    onClick={() => setShowSuccess(false)}
                    aria-label="Zamknij komunikat sukcesu"
                    className="absolute top-1 right-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                  <div className="pr-12">{success}</div>
                  {departmentId && (
                    <div className="mt-2">
                      <InertiaLink
                        href={`/moderator/departments/${departmentId}`}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                      >
                        Szczegóły
                      </InertiaLink>
                    </div>
                  )}
                </div>
              </div>
            )}
            {showError && error && (
              <div className="mx-4 my-4">
                <div className="relative rounded-md bg-red-50 p-3 text-red-800 border border-red-100">
                  <button
                    onClick={() => setShowError(false)}
                    aria-label="Zamknij komunikat błędu"
                    className="absolute top-1 right-1 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                  <div className="pr-12">{error}</div>
                  {departmentId && (
                    <div className="mt-2">
                      <InertiaLink
                        href={`/moderator/departments/${departmentId}`}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                      >
                        Szczegóły
                      </InertiaLink>
                    </div>
                  )}
                </div>
              </div>
            )}
          <div className="p-4">
            {displayedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center mx-4 my-6">
                {displayedItems.map((d: any) => (
                  <DepartamentCardSimple
                    user={{ role: 'moderator' }}
                    departament={d}
                    key={d.id}
                    onEdit={() => router.visit(`/moderator/departments/${d.id}/edit`)}
                    onHallPreview={() => router.visit(`/moderator/departments/${d.id}/hall-preview`)}
                    onDelete={() => router.delete(`/moderator/departments/${d.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mx-4 my-6">Brak wydziałów do wyświetlenia.</p>
            )}
          </div>

            {/* PAGINATION */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
              {isServerPaginator && raw.links ? (
                <div className="inline-flex items-center gap-2 bg-white shadow-lg rounded-full px-3 py-2 text-sm text-gray-800">
                  {raw.links.map((link: any, idx: number) => {
                    const isDisabled = !link.url;
                    const isActive = !!link.active;
                    return (
                      <InertiaLink
                        key={idx}
                        href={link.url ?? '#'}
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full transition-colors duration-150
                            ${isActive ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white/0 text-gray-800 hover:bg-gray-100'}
                            ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        aria-current={isActive ? 'page' : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                // client-side pagination controls
                items.length > PER_PAGE && (
                  <div className="inline-flex items-center gap-2 bg-white shadow-lg rounded-full px-3 py-2 text-sm text-gray-800">
                    <button
                      onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                      disabled={pageIndex === 1}
                      className="px-3 py-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                    >
                      Prev
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => {
                      const idx = i + 1;
                      return (
                        <button
                          key={idx}
                          onClick={() => setPageIndex(idx)}
                          className={`px-3 py-1 rounded-full ${pageIndex === idx ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}
                        >
                          {idx}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
                      disabled={pageIndex === totalPages}
                      className="px-3 py-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )
              )}
            </div>
        </ModeratorLayout>
    );
}

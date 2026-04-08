import React, { useEffect, useState } from "react";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, Link as InertiaLink, router } from "@inertiajs/react";
import MachineCardSimple from "@/components/card/machineCardSimple";
import MachinesNavMenu from "@/components/menu/moderator-machine-nav-menu";

export default function moderatorMachineIndex() {
  const page = usePage<any>();
  const raw = page.props?.machines ?? [];
  const isServerPaginator = raw && !Array.isArray(raw) && !!raw.data;
  const items: any[] = isServerPaginator ? (raw.data ?? []) : (Array.isArray(raw) ? raw : []);

  const PER_PAGE = 6;
  const [pageIndex, setPageIndex] = useState<number>(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const clientPagedItems = items.slice((pageIndex - 1) * PER_PAGE, pageIndex * PER_PAGE);

  // wymuś perPage = 6 jeśli backend nie zwrócił odpowiedniej ilości (pierwsze wejście)
  useEffect(() => {
    try {
      const perPage = raw?.meta?.per_page ?? null;
      if (perPage && Number(perPage) !== PER_PAGE && isServerPaginator) {
        router.get(window.location.pathname, { perPage: PER_PAGE }, { replace: true });
      }
    } catch (e) {
      // silent
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedItems = isServerPaginator ? items : clientPagedItems;

  const breadcrumbs = [
    { label: "Panel Moderatora", href: "/moderator" },
    { label: "Panel sterowania maszyn", href: "/moderator/machines" },
  ];

  return (
    <ModeratorLayout breadcrumbs={breadcrumbs} title="Panel sterowania maszyn">
        <MachinesNavMenu />
      <div className="mt-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.length > 0 ? (
            displayedItems.map((m: any) => <MachineCardSimple key={m.id} machine={m} user={{ role: 'moderator' }} />)
          ) : (
            <p className="text-gray-500 mx-4 my-6">Brak maszyn do wyświetlenia.</p>
          )}
        </div>
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

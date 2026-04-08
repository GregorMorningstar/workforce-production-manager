import React, { useState, useEffect, useRef } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { NavMain } from '@/components/nav-main';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faUsers,
  faCogs,
  faChartLine,
  faPlus,
  faList,
  faExclamationTriangle,
  faSitemap,
  faWrench,
  faCalendar,
  faSchool,
  faEnvelopeCircleCheck,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';

// Lucide
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutGrid, Folder, BookOpen } from 'lucide-react';
import { dashboard } from '@/routes';

export default function ModeratorSidebarMenu(): React.ReactElement {
  const page = usePage();
  const user = (page.props as any).auth?.user ?? {};
  const barcodeValue = user.barcode ?? user.barcode_value ?? user.barcode_number ?? (user.id ? String(user.id) : '—');

  const items = [
    {
      title: 'Panel główny',
      href: '/moderator/dashboard',
      icon: (props: any) => <FontAwesomeIcon {...props} icon={faTachometerAlt} className="h-4 w-4" />,
    },
  ];

  const [openKey, setOpenKey] = useState<'employees' | 'departments' | 'machines' | 'incidents' | 'leaves' | 'performance' | 'production' | 'products' | null>(null);
  const toggle = (key: typeof openKey) => setOpenKey(prev => (prev === key ? null : key));

  const currentUrl = (page as any).url ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  const isActive = (href: string) => currentUrl?.startsWith(href);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const threshold = 80;
    const ro = new ResizeObserver(() => setIsCollapsed(el.clientWidth < threshold));
    ro.observe(el);
    setIsCollapsed(el.clientWidth < threshold);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-3 px-3">

      <div className="w-full mt-2">
        <NavMain items={items as any} />
      </div>

      <div className="w-full mt-2">
        {/* Employees */}
        <SectionButton
          title="Pracownicy"
          icon={faUsers}
          openKey={openKey}
          name="employees"
          toggle={toggle}
          isActive={isActive}
          links={[
            { href: '/moderator/users', label: 'Lista pracowników' },
            { href: '/moderator/users/confirmation-work-certificates', label: 'Potwierdz świadectwa pracowników' },
            { href: '/moderator/users/confirmation-education', label: 'Potwierdz edukacje' },
          ]}
        />

        {/* Leaves */}
        <SectionButton
          title="Urlopy"
          icon={faCalendar}
          openKey={openKey}
          name="leaves"
          toggle={toggle}
          isActive={isActive}
          links={[{ href: '/moderator/leaves', label: 'Kalendarz urlopów' }, { href: '/moderator/leaves/pending', label: 'Oczekujące wnioski' }]}
        />

        {/* Departments */}
        <SectionButton
          title="Wydziały"
          icon={faSitemap}
          openKey={openKey}
          name="departments"
          toggle={toggle}
          isActive={isActive}
          links={[
            { href: '/moderator/departments', label: 'Lista Wydziały' },
            { href: '/moderator/departments/active-employees', label: 'Lista pracowników na wydziałach' },
            { href: '/moderator/departments/create', label: 'Dodaj wydział' },
          ]}
        />

        {/* Machines */}
        <SectionButton
          title="Maszyny"
          icon={faCogs}
          openKey={openKey}
          name="machines"
          toggle={toggle}
          isActive={isActive}
          links={[
            { href: '/moderator/machines', label: 'Lista maszyn' },
            { href: '/moderator/machines/add-new', label: 'Dodaj maszynę' },
            { href: '/moderator/machines/operations', label: 'Operacje' },
          ]}
        />

        {/* Incidents */}
        <SectionButton
          title="Awarie"
          icon={faExclamationTriangle}
          openKey={openKey}
          name="incidents"
          toggle={toggle}
          isActive={isActive}
          links={[
              { href: '/machines/report-failure', label: 'Lista Awarii' },
              { href: '/machines/failures/history', label: 'Historia' },
              { href: '/machines/failures/reports', label: 'Raporty' },
            ]}
        />

        {/* Performance */}
        <SectionButton
          title="Wydajność"
          icon={faChartLine}
          openKey={openKey}
          name="performance"
          toggle={toggle}
          isActive={isActive}
          links={[{ href: '/moderator/performance', label: 'Przegląd wydajności' }, { href: '/moderator/performance/reports', label: 'Raporty' }]}
        />

        {/* Production */}
        <SectionButton
          title="Planowanie produkcji"
          icon={faSitemap}
          openKey={openKey}
          name="production"
          toggle={toggle}
          isActive={isActive}
          links={[
            { href: '/moderator/production-materials', label: 'Magazyn Wyrobos Surowych' },
            { href: '/moderator/production/planning', label: 'Zaplanuj produkcję' },
            { href: '/moderator/production/departments', label: 'Produkcja na wydziałach' },
            { href: '/moderator/production/history', label: 'Historia' },
          ]}
        />

        {/* Products */}
        <SectionButton
          title="Produkty"
          icon={faWarehouse}
          openKey={openKey}
          name="products"
          toggle={toggle}
          isActive={isActive}
          links={[
            { href: '/moderator/items/', label: 'Produkty' },
            { href: '/moderator/items/products/sold', label: 'Ilość sprzedanych' },
            { href: '/moderator/items/processes', label: 'Proces produkcji' },
          ]}
        />

        {/* Orders */}
        <SectionButton
          title="Zamówienia"
          icon={faList}
          openKey={openKey}
          name="orders"
          toggle={toggle}
          isActive={isActive}
          links={[
            { href: '/moderator/orders', label: 'Produkty zamówienia' },
            { href: '/moderator/orders/sold-items', label: 'Ilość sprzedanych' },
          ]}
        />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>

            </SidebarMenuButton>
          </SidebarMenuItem>



        </SidebarMenu>
      </div>
    </div>
  );
}

function SectionButton({ title, icon, openKey, name, toggle, isActive, links }: any) {
  return (
    <div className="w-full mt-3">
      <button
        type="button"
        onClick={() => toggle(name)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${openKey === name ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        aria-expanded={openKey === name}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
          <span>{title}</span>
        </div>
        <svg className={`h-4 w-4 transition-transform ${openKey === name ? 'rotate-180' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${openKey === name ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`} aria-hidden={openKey !== name}>
        <div className="flex flex-col space-y-1 pl-6">
          {links.map((l: any) => (
            <Link key={l.href} href={l.href} className={`text-sm px-2 py-1 rounded block ${isActive(l.href) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

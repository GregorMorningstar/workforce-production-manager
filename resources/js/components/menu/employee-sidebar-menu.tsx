import React, { useState, useEffect, useRef } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { NavMain } from '@/components/nav-main';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import type { NavItem as NavItemType } from '@/types';
import Barcode from 'react-barcode';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faGraduationCap,
  faBriefcase,
  faCalendar,
  faCogs,
  faList,
  faWrench,
  faUser,
  faNetworkWired,
  faIndustry,
} from '@fortawesome/free-solid-svg-icons';
import { machine } from 'os';

export default function EmployeeSidebarMenu(): React.ReactElement {
  const page = usePage();
  const user = (page.props as any).auth?.user ?? {};
  const barcodeValue =
    user.barcode ??
    user.barcode_value ??
    user.barcode_number ??
    (user.id ? String(user.id) : '—');

  const FaTachometerIcon = React.forwardRef<any, any>((props, ref) => (
    <FontAwesomeIcon ref={ref as any} {...props} icon={faTachometerAlt} className="h-4 w-4" />
  ));

  const items: NavItemType[] = [
    {
      title: 'Panel główny',
      href: '/employee/dashboard',
      icon: FaTachometerIcon,
    },
  ];

  const [openKey, setOpenKey] = useState<'education' | 'company' | 'calendar' | 'machines' | 'profile' | 'production' | null>(null);
  const toggle = (key: 'education' | 'company' | 'calendar' | 'machines' | 'profile' | 'production') =>
    setOpenKey(prev => (prev === key ? null : key));

  const currentUrl =
    (page as any).url ?? (typeof window !== 'undefined' ? window.location.pathname : '');

  // normalize and support both "adress" and "address" spellings
  const normalize = (p: string) => p.replace(/\/+$/, '').toLowerCase();
  const isActive = (href: string) => {
    const cur = normalize(currentUrl || '');
    const h = normalize(href);
    if (cur.startsWith(h)) return true;
    // support common misspelling: adress <-> address
    if (h.includes('/adress')) {
      return cur.startsWith(h.replace('/adress', '/address'));
    }
    if (h.includes('/address')) {
      return cur.startsWith(h.replace('/address', '/adress'));
    }
    return false;
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const threshold = 80;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setIsCollapsed(w < threshold);
    });
    ro.observe(el);
    // initial check
    setIsCollapsed(el.clientWidth < threshold);
    return () => ro.disconnect();
  }, []);

  // centralize routes for easy changes
  const routes = {
    dashboard: '/employee/dashboard',
    calendar: '/employee/calendar',
    calendarHistory: '/employee/calendar/history',
    profile: '/employee/profile',
    address: '/employee/adress',
    addressCreate: '/employee/adress/create',
    educationList: '/employee/education/all',
    educationCreate: '/employee/education/create',
    companyList: '/employee/company',
    companyCreate: '/employee/company/create',
    machinesReport: '/machines/report-failure',
    machinesHistory: '/machines/failures/history',
    machinesUser: '/machines/user',
    productionMy: '/employee/production/my',
    productionHistory: '/employee/production/history',
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-3 px-3">
      {/* show barcode only when sidebar is wide enough */}
      {!isCollapsed && (
        <>
          <div className="w-full flex items-center justify-center">
            <div className="w-full">
              <Barcode
                value={barcodeValue}
                format="CODE128"
                renderer="svg"
                width={1.8}
                height={100}
                displayValue={false}
                margin={0}
                lineColor="#111827"
              />
            </div>
          </div>

          <div className="w-full text-center text-xs font-mono text-gray-700 break-words">
            {barcodeValue}
          </div>
        </>
      )}

      <div className="w-full mt-2">
        <NavMain items={items} />
      </div>

      <div className="w-full mt-2">
           {/* Calendar */}
        <div className="w-full mt-3">
          <button
            type="button"
            onClick={() => toggle('calendar')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition
              ${openKey === 'calendar' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-expanded={openKey === 'calendar'}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
              <span>Kalendarz</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openKey === 'calendar' ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${openKey === 'calendar' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            aria-hidden={openKey !== 'calendar'}
          >
            <div className="flex flex-col space-y-1 pl-6">
              <Link
                href={routes.calendar}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.calendar) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Mój grafik
              </Link>
              <Link
                href={routes.calendarHistory}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.calendarHistory) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Nieobecności
              </Link>
            </div>
          </div>
        </div>

        {/* My Profile */}
        <div className="w-full mt-3">
          <button
            type="button"
            onClick={() => toggle('profile')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition
              ${openKey === 'profile' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-expanded={openKey === 'profile'}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
              <span>Mój Profil</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openKey === 'profile' ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${openKey === 'profile' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            aria-hidden={openKey !== 'profile'}
          >
            <div className="flex flex-col space-y-1 pl-6">
              <Link
                href={routes.profile}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.profile) && !isActive(routes.address) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faUser} className="mr-2" /> Mój profil
              </Link>
              <Link
                href={routes.address}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.address) && !isActive(routes.addressCreate) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Mój adres
              </Link>
              <Link
                href={routes.addressCreate}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.addressCreate) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Dodaj adres
              </Link>
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => toggle('education')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition
              ${openKey === 'education' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-expanded={openKey === 'education'}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4" />
              <span>Edukacja</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openKey === 'education' ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${openKey === 'education' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            aria-hidden={openKey !== 'education'}
          >
            <div className="flex flex-col space-y-1 pl-6">
              <Link
                href={routes.educationList}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.educationList) && !isActive(routes.educationCreate) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Moja edukacja
              </Link>
              <Link
                href={routes.educationCreate}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.educationCreate) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Dodaj edukację
              </Link>
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="w-full mt-3">
          <button
            type="button"
            onClick={() => toggle('company')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition
              ${openKey === 'company' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-expanded={openKey === 'company'}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FontAwesomeIcon icon={faBriefcase} className="h-4 w-4" />
              <span>Firma</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openKey === 'company' ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${openKey === 'company' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            aria-hidden={openKey !== 'company'}
          >
            <div className="flex flex-col space-y-1 pl-6">
              <Link
                href={routes.companyList}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.companyList) && !isActive(routes.companyCreate) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Moja firma
              </Link>
              <Link
                href={routes.companyCreate}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.companyCreate) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Dodaj firmę
              </Link>
            </div>
          </div>
        </div>

        {/* Machines */}
        <div className="w-full mt-3">
          <button
            type="button"
            onClick={() => toggle('machines')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition
              ${openKey === 'machines' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-expanded={openKey === 'machines'}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FontAwesomeIcon icon={faCogs} className="h-4 w-4" />
              <span>Maszyny</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openKey === 'machines' ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${openKey === 'machines' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            aria-hidden={openKey !== 'machines'}
          >
            <div className="flex flex-col space-y-1 pl-6">
              <Link href={routes.machinesUser}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.machinesUser) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faNetworkWired} className="mr-2" /> Moje maszyny
              </Link>
              <Link
                href={routes.machinesReport}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.machinesReport) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faWrench} className="mr-2" /> Zgłoś uster
              </Link>
              <Link
                href={routes.machinesHistory}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.machinesHistory) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Historia uster
              </Link>
            </div>
          </div>
        </div>

        {/* Production */}
        <div className="w-full mt-3">
          <button
            type="button"
            onClick={() => toggle('production')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition
              ${openKey === 'production' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-expanded={openKey === 'production'}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FontAwesomeIcon icon={faIndustry} className="h-4 w-4" />
              <span>Produkcja</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openKey === 'production' ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${openKey === 'production' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            aria-hidden={openKey !== 'production'}
          >
            <div className="flex flex-col space-y-1 pl-6">
              <Link
                href={routes.productionMy}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.productionMy) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Moja produkcja
              </Link>
              <Link
                href={routes.productionHistory}
                className={`text-sm px-2 py-1 rounded block ${isActive(routes.productionHistory) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" /> Historia
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { ReactNode } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faUser, faMapMarkerAlt, faGraduationCap } from '@fortawesome/free-solid-svg-icons';

type Breadcrumb = { label: string; href?: string };

interface ProfileStatus {
  education_completed: boolean;
  work_time_completed: boolean;
  address_completed: boolean;
  overall_completion: number;
}

interface PageProps {
  profileComplete?: boolean;
  profileStatus?: ProfileStatus;
  currentUser?: any;
  [key: string]: any;
}

interface EmployeeLayoutProps {
  breadcrumbs?: Breadcrumb[];
  menu?: ReactNode;
  children?: ReactNode;
  showTopNav?: boolean;
  title?: string;
}

export default function EmployeeLayout({
  breadcrumbs = [],
  menu,
  children,
  showTopNav = true,
  title = 'Panel Pracownika',
}: EmployeeLayoutProps) {
  const allProps = usePage<PageProps>().props;
  const { profileComplete, profileStatus } = allProps;
  const [showAlert, setShowAlert] = React.useState(true);

  const mapped = breadcrumbs.map(b => ({ title: b.label, href: b.href ?? '' }));

  const completionItems = [
    {
      key: 'education_completed',
      label: 'Dane edukacyjne',
      icon: faGraduationCap,
      completed: profileStatus?.education_completed || false
    },
    {
      key: 'work_time_completed',
      label: 'Miejsce pracy',
      icon: faUser,
      completed: profileStatus?.work_time_completed || false
    },
    {
      key: 'address_completed',
      label: 'Adres zamieszkania',
      icon: faMapMarkerAlt,
      completed: profileStatus?.address_completed || false
    }
  ];

  const ProfileAlert = () => {
    console.log('ProfileAlert called - profileComplete:', profileComplete, 'showAlert:', showAlert);

    if (profileComplete || !showAlert) {
      console.log('ProfileAlert returning null - why:', { profileComplete, showAlert });
      return null;
    }

    const completionPercentage = profileStatus?.overall_completion || 0;

    const actionHref = '/employee/profile';

    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="h-6 w-6 text-yellow-500 mt-0.5"
            />
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-yellow-800">
                Profil niekompletny ({Math.round(completionPercentage)}%)
              </h3>
              <button
                onClick={() => setShowAlert(false)}
                className="ml-3 inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 w-full bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Missing Items */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {completionItems.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center text-xs ${
                    item.completed
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`h-3 w-3 mr-2 ${
                      item.completed ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.completed && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                  {!item.completed && (
                    <span className="ml-1 text-yellow-600">⚠️</span>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/employee/profile"
                className="relative overflow-hidden bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-bold text-white transition-all duration-300 inline-flex items-center shadow-lg hover:shadow-xl animate-pulse"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shine"></div>
                <FontAwesomeIcon icon={faUser} className="h-3 w-3 mr-2 animate-bounce relative z-10" />
                <span className="relative z-10 animate-pulse">UZUPEŁNIJ PROFIL</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayoutTemplate breadcrumbs={mapped}>
      <Head title={title} />

      {/* Profile Completion Alert */}
      <ProfileAlert />

      {showTopNav && (
        <div className="mb-4">
        </div>
      )}
      <div className="flex gap-6">
        {menu && <aside className="w-64 shrink-0">{menu}</aside>}
        <main className="flex-1">
          {children ?? <p className="text-gray-500">Brak zawartości.</p>}
        </main>
      </div>
    </AppLayoutTemplate>
  );
}

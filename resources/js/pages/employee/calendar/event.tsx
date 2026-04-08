import React, { useEffect, useRef, useState } from 'react';
import { usePage, useForm } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

type EventData = {
  id?: string | number;
  title?: string | null;
  start?: Date | string | null;
  end?: Date | string | null;
  allDay?: boolean;
  type?: string | null;
  type_label?: string | null;
  description?: string | null;
  color?: string | null;
  workingDays?: string[];
};

type Props = {
  event?: EventData | null;
  onClose?: () => void;
  user?: any;
  messageAutoCloseMs?: number;
};

const LEAVE_TYPES: Record<string,string> = {
  annual: 'Urlop wypoczynkowy',
  sick: 'Urlop zdrowotny',
  unpaid: 'Urlop bezpłatny',
  parental: 'Urlop rodzicielski',
  compassionate: 'Urlop okolicznościowy',
  on_demand: 'Urlop na żądanie',
};

const TYPE_COLORS: Record<string, string> = {
  annual: '#16a34a',       // zielony
  sick: '#ef4444',         // czerwony
  unpaid: '#6b7280',       // szary
  parental: '#7c3aed',     // fiolet
  compassionate: '#000000',// czarny
  on_demand: '#7b1120',    // bordowy
};

export default function Event({
  event,
  onClose,
  user,
  messageAutoCloseMs = 5000,
}: Props) {
  const { props: pageProps } = usePage<any>();
  const currentUser = user ?? pageProps?.auth?.user ?? {};

  const fmt = (d?: Date | string | null) => (d ? new Date(d).toLocaleDateString('pl-PL') : '-');

  type FormData = {
    start_date: string;
    end_date: string;
    leave_type: string;
    description: string;
    working_days_count: number;
    user_id: string | number;
  };

  const { data, setData, post, processing, errors } = useForm<FormData>({
    start_date: event?.start?.toString().split('T')[0] || '',
    end_date: event?.end?.toString().split('T')[0] || '',
    leave_type: event?.type_label || 'annual',
    description: event?.description || '',
    working_days_count: event?.workingDays?.length || 1,
    user_id: currentUser?.id || '',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const messageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Funkcja do liczenia dni roboczych
  const countWorkingDays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;

    const start = new Date(startStr);
    const end = new Date(endStr);
    let count = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // Pomijamy weekendy
        count++;
      }
    }
    return count;
  };

  // Funkcja do walidacji
  const validateDates = (startDate: string, endDate: string, leaveType: string) => {
    const newErrors: string[] = [];

    if (!startDate || !endDate) {
      setValidationErrors(newErrors);
      return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // typy wyłączone z zakazu dat wstecz i z wymogu 3-dniowej zapowiedzi
    const allowPastDates = ['sick', 'on_demand', 'compassionate'];
    const exemptFromThreeDayNotice = ['sick', 'on_demand', 'compassionate'];

    // 1) Nie pozwalaj na daty wsteczne, chyba że typ jest w allowPastDates
    if (!allowPastDates.includes(leaveType)) {
      if (start < today) newErrors.push('⚠️ Data rozpoczęcia nie może być w przeszłości');
      if (end < today) newErrors.push('⚠️ Data zakończenia nie może być w przeszłości');
    }

    // 2) Data zakończenia nie może być przed rozpoczęciem
    if (end < start) {
      newErrors.push('⚠️ Data zakończenia nie może być przed datą rozpoczęcia');
    }

    // 3) Minimalna zapowiedź: 3 dni robocze przed rozpoczęciem (chyba że typ jest w wyjątku)
    if (!exemptFromThreeDayNotice.includes(leaveType)) {
      let workingDaysUntilStart = 0;
      const iter = new Date(today);
      iter.setDate(iter.getDate() + 1);
      while (iter <= start) {
        const dow = iter.getDay();
        if (dow !== 0 && dow !== 6) workingDaysUntilStart++;
        iter.setDate(iter.getDate() + 1);
      }

      if (workingDaysUntilStart < 3) {
        newErrors.push(`⚠️ Urlop musi być zgłoszony co najmniej 3 dni robocze przed rozpoczęciem (obecnie ${workingDaysUntilStart})`);
      }
    }

    setValidationErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setData(field as any, value);

    if (field === 'start_date' || field === 'end_date' || field === 'leave_type') {
      const startDate = field === 'start_date' ? value : data.start_date;
      const endDate = field === 'end_date' ? value : data.end_date;
      const leaveType = field === 'leave_type' ? value : data.leave_type;

      validateDates(startDate, endDate, leaveType);
    }
  };

  const handleSave = () => {
    const isValid = validateDates(data.start_date, data.end_date, data.leave_type);

    if (!isValid) {
      return;
    }

    post('/employee/calendar/store', {
      onSuccess: () => {
        onClose?.();
      },
      onError: (errors) => {
        console.log('Błędy walidacji:', errors);
      },
    });
  };

  if (!event) return null;

  const color = TYPE_COLORS[data.leave_type] || '#0f172a';
  const workingDaysCount = countWorkingDays(data.start_date, data.end_date);

  return (
    <div className="w-full max-w-2xl">
      <div
        className="bg-white rounded-lg shadow-xl overflow-hidden"
        style={{ borderLeft: `5px solid ${color}` }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r p-4" style={{ backgroundColor: color }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Wniosek urlopu</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
              aria-label="Zamknij"
              disabled={processing}
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Pracownik</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {currentUser?.name || 'Brak danych'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Email</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {currentUser?.email || 'Brak danych'}
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex gap-2 mb-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-1" />
                <p className="text-sm font-semibold text-yellow-900">Ostrzeżenia:</p>
              </div>
              <ul className="space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="text-sm text-yellow-800">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content - Grid Layout */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Left Column - Dates */}
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Data rozpoczęcia
                  </label>
                  <input
                    type="date"
                    value={data.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    disabled={processing}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
                  />
                  {errors.start_date && (
                    <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{fmt(data.start_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Data zakończenia
                  </label>
                  <input
                    type="date"
                    value={data.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    disabled={processing}
                    min={data.start_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
                  />
                  {errors.end_date && (
                    <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{fmt(data.end_date)}</p>
                </div>
              </div>

              {/* Working Days Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Liczba dni roboczych</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{workingDaysCount}</p>
              </div>
            </div>

            {/* Right Column - Leave Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rodzaj urlopu
              </label>
              <select
                value={data.leave_type}
                onChange={(e) => handleInputChange('leave_type', e.target.value)}
                disabled={processing}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
              >
                {Object.entries(LEAVE_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.leave_type && (
                <p className="text-xs text-red-600 mt-1">{errors.leave_type}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Opis / Uwagi
            </label>
            <textarea
              value={data.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={processing}
              placeholder="Dodaj uwagi dotyczące wniosku..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm disabled:bg-slate-100"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-sm disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={processing || validationErrors.length > 0}
            style={{ backgroundColor: color }}
            className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition font-medium flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSave} />
            {processing ? 'Wysyłanie...' : 'Wyślij wniosek'}
          </button>
        </div>
      </div>
    </div>
  );
}


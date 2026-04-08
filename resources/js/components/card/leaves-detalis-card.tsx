import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck, faTimes, faCalendar, faUser, faBarcode, faComment, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import Barcode from 'react-barcode';
import { AlertCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import echo from '@/lib/echo';

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

type LeaveData = {
  id: number;
  barcode?: string;
  start_date: string;
  end_date: string;
  type: string;
  description?: string;
  status: string;
  user?: {
    id: number;
    name: string;
    email: string;
    barcode?: string;
  };
};

type Props = {
  leave?: LeaveData;
  userLeaves?: any[];
  currentUserRole?: string;
  currentUserId?: number;
  moderatorId?: number;
  initialMessages?: ChatMessage[];
  [key: string]: any;
};

const LEAVE_TYPES: Record<string, string> = {
  annual: 'Urlop wypoczynkowy',
  sick: 'Urlop zdrowotny',
  unpaid: 'Urlop bezpłatny',
  parental: 'Urlop rodzicielski',
  compassionate: 'Urlop okolicznościowy',
  on_demand: 'Urlop na żądanie',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekuje',
  approved: 'Zaakceptowany',
  rejected: 'Odrzucony',
  cancelled: 'Anulowany',
};

export default function LeavesDetailsCard({
  leave,
  userLeaves,
  currentUserRole = 'employee',
  currentUserId,
  moderatorId,
  initialMessages = [],
  ...props
}: Props) {
  const { props: pageProps } = usePage<{ auth?: { user?: { id: number } } }>();
  const userId = currentUserId || pageProps.auth?.user?.id;

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine chat partner (employee talks to moderator, moderator talks to employee)
  const getChatPartnerId = useCallback(() => {
    if (currentUserRole === 'employee') {
      // Employee talks to moderator - for now use leave.user.id as fallback or moderatorId
      return moderatorId || 1; // TODO: Get actual moderator ID from backend
    } else {
      // Moderator talks to employee who submitted the leave
      return leave?.user?.id;
    }
  }, [currentUserRole, moderatorId, leave?.user?.id]);

  // Load existing messages when chat opens
  const loadMessages = useCallback(async () => {
    const partnerId = getChatPartnerId();
    if (!partnerId) return;

    try {
      const res = await fetch(`/chat?other_user_id=${partnerId}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.chats) {
          setMessages(data.chats);
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [getChatPartnerId]);

  // Subscribe to Echo channel for real-time messages
  useEffect(() => {
    if (!isChatModalOpen || !userId) return;

    const channel = echo.private(`chat.${userId}`)
      .listen('MessageSent', (e: any) => {
        setMessages(prev => {
          if (prev.some(m => m.id === e.chatMessage.id)) return prev;
          return [...prev, e.chatMessage];
        });
      });

    return () => {
      channel.stopListening('MessageSent');
      echo.leaveChannel(`private-chat.${userId}`);
    };
  }, [isChatModalOpen, userId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!leave) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <FontAwesomeIcon icon={faCalendar} size="2x" className="mb-4" />
          <p>Brak danych urlopu</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleEdit = () => {
    if (leave?.status === 'pending') {
      // Przekieruj na stronę edycji dla urlopów oczekujących
      window.location.href = `/employee/calendar/edit/${leave.id}`;
    } else {
      console.log('Edit leave:', leave?.id);
    }
  };

  const handleWithdraw = () => {
    // TODO: Implement withdraw functionality
    console.log('Withdraw leave:', leave.id);
  };

  const handleApprove = () => {
    // TODO: Implement approve functionality
    console.log('Approve leave:', leave.id);
  };

  const handleReject = () => {
    // TODO: Implement reject functionality
    console.log('Reject leave:', leave.id);
  };

  const handleChat = () => {
    // TODO: Implement chat functionality
    console.log('Open chat with user:', leave.user?.id);
    setIsChatModalOpen(true);
  };

  const handleChatToModerator = () => {
    // TODO: Implement chat to moderator functionality
    console.log('Open chat to moderator from user:', leave.id);
    setIsChatModalOpen(true);
    loadMessages();
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isSending) return;

    const partnerId = getChatPartnerId();
    if (!partnerId) {
      console.error('No chat partner ID available');
      return;
    }

    setIsSending(true);

    try {
      const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
      if (!csrf) {
        console.error('CSRF token not found');
        setIsSending(false);
        return;
      }

      const socketId = (window as any).Echo?.socketId?.() || '';

      const res = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf,
          'X-Socket-ID': socketId
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          other_user_id: partnerId,
          message: chatMessage.trim(),
        })
      });

      if (res.ok) {
        const created: ChatMessage = await res.json();
        setMessages(prev => {
          if (prev.some(m => m.id === created.id)) return prev;
          return [...prev, created];
        });
        setChatMessage('');
      } else {
        const error = await res.json();
        console.error('Error sending message:', error);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAlertToModerator = () => {

    console.log('Alert moderator from user:', leave.id);
    };

  const statusColor = STATUS_COLORS[leave.status] || '#6b7280';
  const daysCount = calculateDays(leave.start_date, leave.end_date);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header z danymi użytkownika */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <FontAwesomeIcon icon={faUser} size="lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{leave.user?.name || 'Nieznany użytkownik'}</h2>
                <p className="text-blue-200">{leave.user?.email || ''}</p>
              </div>
            </div>

            {/* Barcode użytkownika i ikona chatu dla moderatora */}
            <div className="flex items-center space-x-3">
              {leave.user?.barcode && (
                <div className="bg-white bg-opacity-20 rounded-lg p-3 border border-white border-opacity-30">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faBarcode} className="text-white text-sm" />
                      <span className="text-white text-xs font-medium uppercase tracking-wide">ID Pracownika</span>
                    </div>
                    <div className="flex justify-center">
                          <Barcode
                            value={String(leave.user.barcode ?? '')}
                            format="CODE128"
                            renderer="svg"
                            width={2}
                            height={40}
                            fontSize={0}
                            background="#f9fafb"
                            lineColor="#374151"
                            margin={0}
                            displayValue={true}
                          />
                    </div>
                    <span className="text-black text-xs font-mono font-semibold tracking-wider">
                      {leave.user.barcode}
                    </span>
                  </div>
                </div>
              )}

              {/* Ikona chatu dla moderatora */}
              {(currentUserRole === 'moderator' || currentUserRole === 'admin') && (
                <button
                  onClick={handleChat}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 transition duration-200 border border-white border-opacity-30"
                  title="Napisz do użytkownika"
                >
                  <FontAwesomeIcon icon={faComment} className="text-white text-lg" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Barcode urlopu */}
        {leave.barcode && (
          <div className="bg-gray-50 border-b border-gray-200 p-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex justify-center">
                <Barcode
                  value={String(leave.barcode ?? '')}
                  format="CODE128"
                  renderer="svg"
                  width={2}
                  height={60}
                  fontSize={0}
                  background="#f9fafb"
                  lineColor="#374151"
                  margin={0}
                  displayValue={false}
                />
              </div>
              <span className="text-lg font-mono font-semibold text-gray-800 tracking-wider">
                {leave.barcode}
              </span>
            </div>
          </div>
        )}

        {/* Główne informacje o urlopie */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Status */}
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <div>
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <p className="font-semibold" style={{ color: statusColor }}>
                  {STATUS_LABELS[leave.status] || leave.status}
                </p>
              </div>
            </div>

            {/* Typ urlopu */}
            <div>
              <p className="text-sm text-gray-600 font-medium">Typ urlopu</p>
              <p className="font-semibold text-gray-900">
                {LEAVE_TYPES[leave.type] || leave.type}
              </p>
            </div>

            {/* Data rozpoczęcia */}
            <div>
              <p className="text-sm text-gray-600 font-medium">Data rozpoczęcia</p>
              <p className="font-semibold text-gray-900">
                {formatDate(leave.start_date)}
              </p>
            </div>

            {/* Data zakończenia */}
            <div>
              <p className="text-sm text-gray-600 font-medium">Data zakończenia</p>
              <p className="font-semibold text-gray-900">
                {formatDate(leave.end_date)}
              </p>
            </div>
          </div>

          {/* Liczba dni i pozostałe dni */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Liczba dni urlopu */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{daysCount}</p>
                <p className="text-sm text-blue-600 font-medium">
                  {daysCount === 1 ? 'dzień urlopu' : daysCount < 5 ? 'dni urlopu' : 'dni urlopu'}
                </p>
              </div>
            </div>

            {/* Pozostałe dni urlopu */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">12</p>
                <p className="text-sm text-green-600 font-medium">
                  dni pozostałych
                </p>
              </div>
            </div>
          </div>

          {/* Opis */}
          {leave.description && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 font-medium mb-2">Opis/Uwagi</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">{leave.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Przyciski akcji */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex flex-wrap gap-3 justify-between">
            {/* Akcje dla użytkownika */}
            {currentUserRole === 'employee' && (
              <div className="flex gap-3">
                {(leave.status === 'pending' || leave.status === 'rejected') && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edytuj</span>
                  </button>
                )}

                {leave.status === 'pending' && (
                  <button
                    onClick={handleWithdraw}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Wycofaj</span>
                  </button>
                )}

                <button
                  onClick={handleChatToModerator}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  title="Napisz do moderatora"
                >
                  <FontAwesomeIcon icon={faComment} />
                  <span>Chat</span>
                </button>

                    <button
                  onClick={handleAlertToModerator}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  title="Napisz do moderatora"
                >
                  <AlertCircle />
                  <span>Szybkie zgłoszenie</span>
                </button>
              </div>
            )}

            {/* Akcje dla moderatora */}
            {(currentUserRole === 'moderator' || currentUserRole === 'admin') && leave.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Zaakceptuj</span>
                </button>

                <button
                  onClick={handleReject}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  <FontAwesomeIcon icon={faTimes} />
                  <span>Odrzuć</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isChatModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-end z-50 p-4"
          onClick={() => setIsChatModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-96 max-w-full h-full max-h-[600px] mr-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faComment} className="text-white" />
                  <span className="text-white font-semibold">
                    Chat z moderatorem (ID: 2)
                  </span>
                </div>
                <button
                  onClick={() => setIsChatModalOpen(false)}
                  className="text-white hover:bg-blue-700 rounded-full p-2 transition"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col h-full">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 mb-4 overflow-y-auto min-h-[300px] max-h-[400px]">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      Rozpocznij rozmowę z moderatorem
                    </div>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.sender_id === userId
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                        >
                          <p>{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === userId ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="flex space-x-2 mt-auto">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Napisz wiadomość..."
                  disabled={isSending}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={isSending ? faComment : faPaperPlane} className={isSending ? 'animate-pulse' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

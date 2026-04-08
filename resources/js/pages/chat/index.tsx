import React, { useEffect, useState, useCallback, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import echo from '@/lib/echo';

interface User {
  id: number;
  name: string;
  email: string;
}

interface OnlineUserMeta { id: number; name: string }

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

interface ChatPageProps  {
  user_id: number;
  other_user_id: number | null;
  users: User[];
  chats: ChatMessage[];
}

const ChatPage: React.FC<ChatPageProps> = ({ user_id, other_user_id, users, chats }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(chats || []);
  const [input, setInput] = useState('');
  const [echoStatus, setEchoStatus] = useState<string>('init');
  const castConnector = () => (echo as any).connector?.pusher;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [onlineIds, setOnlineIds] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
  const conn = castConnector()?.connection;
  setEchoStatus(conn?.state || 'connecting');
    if (conn) {
      const handler = (states: any) => setEchoStatus(states.current || conn.state);
      conn.bind('state_change', handler);
      return () => conn.unbind('state_change', handler);
    }
  }, []);

  useEffect(() => {
  let cancelled = false;
  let channel: any = null;
  let presenceChannel: any = null;
  let channelName: string | null = null;
  const boot = async () => {``
      let attempts = 0;
      while (!(window as any).Echo && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      if (cancelled) return;
      if (!(window as any).Echo) {
        console.error('[Echo] nadal brak instancji po oczekiwaniu');
        return;
      }
  channelName = `private-chat.${user_id}`;
      setEchoStatus(castConnector()?.connection?.state || 'connecting');

  channel = echo.private(`chat.${user_id}`)
        .listen('MessageSent', (e: any) => {
          setMessages(prev => {
              if (prev.some(m => m.id === e.chatMessage.id)) return prev;
              return [...prev, e.chatMessage];
          });
        })
        .listenForWhisper('typing', (e: any) => {
          if (e.user_id === other_user_id) {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
          }
        });

      try {
        // Presence channel for online status: use logical name 'chat' (Echo will prefix 'presence-')
        presenceChannel = (echo as any).join('chat')
          .here((users: OnlineUserMeta[]) => {
            setOnlineIds(users.map(u => u.id));
          })
          .joining((user: OnlineUserMeta) => {
            setOnlineIds(prev => prev.includes(user.id) ? prev : [...prev, user.id]);
          })
          .leaving((user: OnlineUserMeta) => {
            setOnlineIds(prev => prev.filter(id => id !== user.id));
          });
      } catch (e) { console.warn('Presence join error', e); }

      try {
        const conn = castConnector()?.connection;
        if (conn) {
          const handler = (states: any) => setEchoStatus(states.current || conn.state);
          conn.bind('state_change', handler);
          return () => {
            if (channel) channel.stopListening('MessageSent');
            if (channelName) echo.leaveChannel(channelName as string);
            if (presenceChannel) (echo as any).leave('chat');
            conn.unbind('state_change', handler);
          };
        }
      } catch {}
      return () => {
        if (channel) channel.stopListening('MessageSent');
        if (channelName) echo.leaveChannel(channelName as string);
  if (presenceChannel) (echo as any).leave('chat');
      };
    };
    boot();
  return () => { cancelled = true; if (channel) channel.stopListening('MessageSent'); if (channelName) echo.leaveChannel(channelName as string); if (presenceChannel) (echo as any).leave('chat'); };
  }, [user_id]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !other_user_id) return;

    try {
      const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
      if (!csrf) return;
      const socketId = (window as any).Echo?.socketId?.() || '';

      const res = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf || '',
          'X-Socket-ID': socketId
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          other_user_id: other_user_id,
          message: input.trim(),
        })
      });

      if (res.ok) {
        const created: ChatMessage = await res.json();
        setMessages(prev => {
          const exists = prev.some(m => m.id === created.id);
          if (exists) return prev;
          return [...prev, created];
        });
        setInput('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [input, other_user_id]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (other_user_id && e.target.value.trim()) {
      try {
        const channel = (echo as any).private?.(`chat.${other_user_id}`);
        if (channel?.whisper) {
          channel.whisper('typing', { user_id });
        }
      } catch {}
    }
  }, [other_user_id, user_id]);

  const activeUser = other_user_id ? users.find(u => u.id === other_user_id) : null;

  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 20);
    return () => clearTimeout(t);
  }, [messages, other_user_id]);

  const breadcrumbs = [
    { title: 'Strona główna', href: '/' },
    { title: 'Chat', href: '/chat' }
  ];

  return (

     <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Chat" />
    <div className="container mx-auto shadow-lg rounded-lg">
      {/* header */}
      <div className="px-5 py-5 flex flex-wrap gap-4 items-center bg-white border-b-2">

        {activeUser ? (
          <div className="text-sm text-blue-600">
            Aktualnie rozmawiasz z <span className="font-semibold">{activeUser.name}</span>
            <span className="text-gray-400 ml-2">(wydział: #Marketing)</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Wybierz użytkownika aby rozpocząć rozmowę</div>
        )}
      </div>
      {/* end header */}
      {/* Chatting */}
      <div className="flex flex-row justify-between bg-white">
        {/* chat list */}
        <div className="flex flex-col w-2/5 border-r-2 overflow-y-auto">
          {/* search component */}
          <div className="border-b-2 py-4 px-2">
            <input
              type="text"
              placeholder="Szukaj użytkownika..."
              className="py-2 px-3 border-2 border-gray-200 rounded-2xl w-full focus:outline-none focus:border-blue-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* end search component */}
          {/* user list z bazy */}
          {(() => {
            const q = search.trim().toLowerCase();
            const filtered = users.filter(u => (
              u.id !== user_id && (
                !q ||
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
              )
            ));
            if (filtered.length === 0) return <div className="p-4 text-sm text-gray-500">Brak wyników</div>;
            return filtered.map(user => {
              const isActive = user.id === other_user_id;
              const online = onlineIds.includes(user.id);
              return (
                <button
                  type="button"
                  key={user.id}
                  className={`flex flex-row gap-3 text-left w-full py-3 px-3 items-center border-b hover:bg-gray-50 focus:outline-none ${isActive ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
                  onClick={() => { window.location.href = `/chat?other_user_id=${user.id}`; }}
                >
                  <img
                    src={user.profile?.profile_photo_url || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                    className="object-cover h-12 w-12 rounded-full"
                    alt={user.name}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                  <span className={`ml-auto w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-red-400'} shadow-inner`} title={online ? 'Online' : 'Offline'}></span>
                </button>
              );
            });
          })()}
          {/* end user list */}
        </div>
        {/* end chat list */}
        {/* message */}
        <div className="w-full flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 px-5 mt-5 space-y-3 overflow-y-auto pr-2 pb-[10vh]">
            {messages.map(msg => {
              const isOwn = msg.sender_id === user_id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && (
                    <img
                      src={activeUser?.profile?.profile_photo_url || activeUser?.avatar || `https://i.pravatar.cc/100?u=${msg.sender_id}`}
                      className="object-cover h-8 w-8 rounded-full mr-2"
                      alt="avatar"
                    />
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-sm shadow max-w-[60%] break-words ${isOwn ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.message}
                    <div className="mt-1 text-[10px] opacity-70 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </div>
                  </div>
                  {isOwn && (
                    <img
                      src={users.find(u => u.id === user_id)?.profile?.profile_photo_url || users.find(u => u.id === user_id)?.avatar || `https://i.pravatar.cc/100?u=${msg.sender_id}`}
                      className="object-cover h-8 w-8 rounded-full ml-2"
                      alt="avatar"
                    />
                  )}
                </div>
              );
            })}
            {/* typing indicator */}
            {isTyping && activeUser && (
              <div className="flex justify-start">
                <img
                  src={activeUser?.profile?.profile_photo_url || activeUser?.avatar || `https://i.pravatar.cc/100?u=${other_user_id}`}
                  className="object-cover h-8 w-8 rounded-full mr-2"
                  alt="avatar"
                />
                <div className="px-4 py-2 rounded-2xl text-sm shadow bg-gray-200 text-gray-800 rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                  </div>
                </div>
              </div>
            )}
            {/* znacznik końca listy do auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Sticky input at bottom */}
          <div className="sticky bottom-0 bg-white border-t px-5 py-4 mt-[5vh]">
            <form onSubmit={sendMessage}>
              <div className="flex gap-2">
                <input
                  className="w-full bg-gray-100 border border-gray-300 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  type="text"
                  placeholder={other_user_id ? 'Napisz wiadomość...' : 'Wybierz użytkownika z listy po lewej'}
                  value={input}
                  onChange={handleInputChange}
                  disabled={!other_user_id}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || !other_user_id}
                  className="px-5 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-40"
                >Wyślij</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>


   </AppLayout>
  );
};

export default ChatPage;

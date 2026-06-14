import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import echo from '@/lib/echo';
import ThemeSwitch from '@/components/theme-switch';

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  profile?: {
    profile_photo_url?: string;
  };
}

interface OnlineUserMeta {
  id: number;
  name: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

interface ChatPageProps {
  user_id: number;
  other_user_id: number | null;
  users: Paginated<User>;
  chats: Paginated<ChatMessage> | null;
  filters?: {
    search?: string;
  };
}

const ChatPage: React.FC<ChatPageProps> = ({ user_id, other_user_id, users, chats, filters }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(chats?.data ?? []);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState(filters?.search ?? '');
  const [onlineIds, setOnlineIds] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [echoStatus, setEchoStatus] = useState<string>('init');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeUser = useMemo(
    () => (other_user_id ? users.data.find((u) => u.id === other_user_id) ?? null : null),
    [other_user_id, users.data],
  );

  const castConnector = () => (echo as any).connector?.pusher;

  const goToChat = useCallback(
    (payload: Record<string, unknown>) => {
      router.get('/chat', payload, { preserveScroll: true, preserveState: true, replace: true });
    },
    [],
  );

  useEffect(() => {
    setMessages(chats?.data ?? []);
  }, [chats?.data]);

  useEffect(() => {
    const conn = castConnector()?.connection;
    setEchoStatus(conn?.state || 'connecting');

    if (!conn) {
      return;
    }

    const handler = (states: any) => setEchoStatus(states.current || conn.state);
    conn.bind('state_change', handler);

    return () => conn.unbind('state_change', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let channel: any = null;
    let presenceChannel: any = null;
    let channelName: string | null = null;

    const boot = async () => {
      let attempts = 0;
      while (!(window as any).Echo && attempts < 20) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (cancelled || !(window as any).Echo) {
        return;
      }

      channelName = `private-chat.${user_id}`;
      channel = echo
        .private(`chat.${user_id}`)
        .listen('MessageSent', (e: any) => {
          const incoming: ChatMessage = e.chatMessage;
          if (!other_user_id) {
            return;
          }

          const belongsToCurrentChat =
            (incoming.sender_id === user_id && incoming.receiver_id === other_user_id) ||
            (incoming.sender_id === other_user_id && incoming.receiver_id === user_id);

          if (!belongsToCurrentChat) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) {
              return prev;
            }
            return [...prev, incoming];
          });
        })
        .listenForWhisper('typing', (e: any) => {
          if (e.user_id === other_user_id) {
            setIsTyping(true);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
          }
        });

      try {
        presenceChannel = (echo as any)
          .join('chat')
          .here((joinedUsers: OnlineUserMeta[]) => {
            setOnlineIds(joinedUsers.map((u) => u.id));
          })
          .joining((user: OnlineUserMeta) => {
            setOnlineIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
          })
          .leaving((user: OnlineUserMeta) => {
            setOnlineIds((prev) => prev.filter((id) => id !== user.id));
          });
      } catch {
        // Presence can fail silently when websocket is unavailable.
      }
    };

    boot();

    return () => {
      cancelled = true;
      if (channel) {
        channel.stopListening('MessageSent');
      }
      if (channelName) {
        echo.leaveChannel(channelName);
      }
      if (presenceChannel) {
        (echo as any).leave('chat');
      }
    };
  }, [other_user_id, user_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 40);

    return () => clearTimeout(timer);
  }, [messages]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      goToChat({
        other_user_id,
        search,
        users_page: 1,
        messages_page: chats?.current_page ?? 1,
      });
    },
    [chats?.current_page, goToChat, other_user_id, search],
  );

  const handleUserPage = useCallback(
    (nextPage: number) => {
      goToChat({
        other_user_id,
        search,
        users_page: nextPage,
        messages_page: chats?.current_page ?? 1,
      });
    },
    [chats?.current_page, goToChat, other_user_id, search],
  );

  const handleMessagesPage = useCallback(
    (nextPage: number) => {
      if (!other_user_id) {
        return;
      }
      goToChat({
        other_user_id,
        search,
        users_page: users.current_page,
        messages_page: nextPage,
      });
    },
    [goToChat, other_user_id, search, users.current_page],
  );

  const handleSelectUser = useCallback(
    (selectedUserId: number) => {
      goToChat({
        other_user_id: selectedUserId,
        search,
        users_page: users.current_page,
        messages_page: 1,
      });
    },
    [goToChat, search, users.current_page],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);

      if (other_user_id && e.target.value.trim()) {
        try {
          const channel = (echo as any).private?.(`chat.${other_user_id}`);
          if (channel?.whisper) {
            channel.whisper('typing', { user_id });
          }
        } catch {
          // noop
        }
      }
    },
    [other_user_id, user_id],
  );

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !other_user_id) {
        return;
      }

      try {
        const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        const socketId = (window as any).Echo?.socketId?.() || '';

        const res = await fetch('/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrf || '',
            'X-Socket-ID': socketId,
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            other_user_id: other_user_id,
            message: input.trim(),
          }),
        });

        if (!res.ok) {
          return;
        }

        const created: ChatMessage = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === created.id)) {
            return prev;
          }
          return [...prev, created];
        });
        setInput('');
      } catch {
        // noop
      }
    },
    [input, other_user_id],
  );

  const breadcrumbs = [
    { title: 'Strona glowna', href: '/' },
    { title: 'Chat', href: '/chat' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Chat" />

      <div className="container mx-auto rounded-lg shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 bg-white px-5 py-5 dark:bg-neutral-900">
          {activeUser ? (
            <div className="text-sm text-blue-600 dark:text-blue-300">
              Aktualnie rozmawiasz z <span className="font-semibold">{activeUser.name}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-neutral-400">Wybierz uzytkownika aby rozpoczac rozmowe</div>
          )}

          <div className="text-xs text-gray-500">Echo: {echoStatus}</div>
          <ThemeSwitch className="min-w-50 w-auto bg-transparent" label="Tryb" />
        </div>

        <div className="flex flex-row justify-between bg-white">
          <div className="flex w-2/5 flex-col overflow-y-auto border-r-2">
            <form className="border-b-2 px-2 py-4" onSubmit={handleSearchSubmit}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Szukaj uzytkownika..."
                  className="w-full rounded-2xl border-2 border-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="rounded-xl border px-3 text-sm">
                  Filtruj
                </button>
              </div>
            </form>

            {users.data.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Brak wynikow</div>
            ) : (
              users.data.map((user) => {
                const isActive = user.id === other_user_id;
                const online = onlineIds.includes(user.id);

                return (
                  <button
                    type="button"
                    key={user.id}
                    className={`flex w-full flex-row items-center gap-3 border-b px-3 py-3 text-left hover:bg-gray-50 focus:outline-none ${isActive ? 'border-l-4 border-blue-400 bg-blue-50' : ''}`}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <img
                      src={user.profile?.profile_photo_url || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                      className="h-12 w-12 rounded-full object-cover"
                      alt={user.name}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                    <span
                      className={`ml-auto h-3 w-3 rounded-full shadow-inner ${online ? 'bg-green-500' : 'bg-red-400'}`}
                      title={online ? 'Online' : 'Offline'}
                    />
                  </button>
                );
              })
            )}

            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-gray-600">
              <button
                type="button"
                className="rounded border px-2 py-1 disabled:opacity-40"
                disabled={users.current_page <= 1}
                onClick={() => handleUserPage(users.current_page - 1)}
              >
                Poprzednia
              </button>
              <span>
                Strona {users.current_page} z {users.last_page}
              </span>
              <button
                type="button"
                className="rounded border px-2 py-1 disabled:opacity-40"
                disabled={users.current_page >= users.last_page}
                onClick={() => handleUserPage(users.current_page + 1)}
              >
                Nastepna
              </button>
            </div>
          </div>

          <div className="flex h-[calc(100vh-200px)] w-full flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-[10vh] pr-2 pt-5">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user_id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!isOwn && (
                      <img
                        src={activeUser?.profile?.profile_photo_url || activeUser?.avatar || `https://i.pravatar.cc/100?u=${msg.sender_id}`}
                        className="mr-2 h-8 w-8 rounded-full object-cover"
                        alt="avatar"
                      />
                    )}
                    <div
                      className={`max-w-[60%] break-words rounded-2xl px-4 py-2 text-sm shadow ${isOwn ? 'rounded-br-none bg-blue-500 text-white' : 'rounded-bl-none bg-gray-200 text-gray-800'}`}
                    >
                      {msg.message}
                      <div className="mt-1 text-right text-[10px] opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && activeUser && (
                <div className="flex justify-start">
                  <img
                    src={activeUser.profile?.profile_photo_url || activeUser.avatar || `https://i.pravatar.cc/100?u=${other_user_id}`}
                    className="mr-2 h-8 w-8 rounded-full object-cover"
                    alt="avatar"
                  />
                  <div className="rounded-2xl rounded-bl-none bg-gray-200 px-4 py-2 text-sm text-gray-800 shadow">
                    <div className="flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                        .
                      </span>
                      <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>
                        .
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {chats && chats.last_page > 1 && (
              <div className="flex items-center justify-between border-t px-5 py-2 text-xs text-gray-600">
                <button
                  type="button"
                  className="rounded border px-2 py-1 disabled:opacity-40"
                  disabled={chats.current_page <= 1}
                  onClick={() => handleMessagesPage(chats.current_page - 1)}
                >
                  Starsze
                </button>
                <span>
                  Strona {chats.current_page} z {chats.last_page}
                </span>
                <button
                  type="button"
                  className="rounded border px-2 py-1 disabled:opacity-40"
                  disabled={chats.current_page >= chats.last_page}
                  onClick={() => handleMessagesPage(chats.current_page + 1)}
                >
                  Nowsze
                </button>
              </div>
            )}

            <div className="sticky bottom-0 mt-[5vh] border-t bg-white px-5 py-4">
              <form onSubmit={sendMessage}>
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    type="text"
                    placeholder={other_user_id ? 'Napisz wiadomosc...' : 'Wybierz uzytkownika z listy po lewej'}
                    value={input}
                    onChange={handleInputChange}
                    disabled={!other_user_id}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || !other_user_id}
                    className="rounded-xl bg-blue-500 px-5 font-medium text-white disabled:opacity-40"
                  >
                    Wyslij
                  </button>
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

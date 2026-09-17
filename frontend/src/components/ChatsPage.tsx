import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import { createConversationConnection, createConversationInboxConnection, destroyConversationConnection, destroyConversationInboxConnection } from '../services/auctionHub';
import './ChatsPage.css';

interface Conversation { listingId: string; title: string; sellerId: string; lastMessage: string; updatedAt: string; unreadCount: number; }
interface Message { id: string; senderId: string; senderName: string; text: string; createdAt: string; }

const ChatsPage: React.FC<{ initialListingId?: string | null }> = ({ initialListingId }) => {
  const { isAuthenticated, user, roles } = useAuth();
  const isManager = roles.includes('Admin') || roles.includes('Moderator');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialListingId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState('Manager chat');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const conversationConnectionRef = useRef<HubConnection | null>(null);
  const conversationInboxConnectionRef = useRef<HubConnection | null>(null);

  const loadConversations = useCallback(async () => {
    const response = await apiCall('/conversations/mine');
    if (!response.ok) throw new Error('Unable to load conversations.');
    const data = await response.json();
    const items: Conversation[] = Array.isArray(data) ? data : [];
    // Access is enforced by GET /conversations/mine on the server. Do not filter
    // this response using a client-side JWT claim: older tokens may use `nameid`
    // instead of `sub`, which would hide an otherwise authorized conversation.
    setConversations(items);
    setSelectedId(current => current ?? items[0]?.listingId ?? null);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadConversations().catch(error => setError(error.message));
  }, [isAuthenticated, isManager, user?.id, loadConversations]);

  useEffect(() => { if (initialListingId) setSelectedId(initialListingId); }, [initialListingId]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    apiCall(`/conversations/${selectedId}`).then(async response => {
      if (!response.ok) throw new Error('Unable to load this chat.');
      const data = await response.json();
      setTitle(data.title || 'Manager chat');
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      void loadConversations();
    }).catch(error => setError(error.message));
  }, [selectedId, loadConversations]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const connect = async () => {
      try {
        const connection = await createConversationInboxConnection();
        if (cancelled) {
          await destroyConversationInboxConnection(connection);
          return;
        }
        conversationInboxConnectionRef.current = connection;
        connection.on('ConversationUpdated', (conversation: Conversation) => {
          setSelectedId(current => current ?? conversation.listingId);
          void loadConversations().catch(loadError => setError(loadError.message));
        });
      } catch {
        // The next visit still obtains the inbox from the REST endpoint.
      }
    };

    void connect();
    return () => {
      cancelled = true;
      const connection = conversationInboxConnectionRef.current;
      conversationInboxConnectionRef.current = null;
      if (connection) void destroyConversationInboxConnection(connection);
    };
  }, [isAuthenticated, loadConversations]);

  useEffect(() => {
    if (!isAuthenticated || !selectedId) return;
    let cancelled = false;

    const connect = async () => {
      try {
        const connection = await createConversationConnection(selectedId);
        if (cancelled) {
          await destroyConversationConnection(connection, selectedId);
          return;
        }
        conversationConnectionRef.current = connection;
        connection.on('ReceiveConversationMessage', (message: Message) => {
          setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
          void loadConversations();
        });
      } catch {
        // The REST endpoint continues to work if a temporary real-time connection fails.
      }
    };

    void connect();
    return () => {
      cancelled = true;
      const connection = conversationConnectionRef.current;
      conversationConnectionRef.current = null;
      if (connection) void destroyConversationConnection(connection, selectedId);
    };
  }, [isAuthenticated, selectedId, loadConversations]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setError('');
    try {
      const response = await apiCall(`/conversations/${selectedId}`, { method: 'POST', body: JSON.stringify({ text: draft }) });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Unable to send message.');
      }
      const message = await response.json();
      // The sender receives the same event through SignalR. This immediate update
      // keeps the message visible even if the socket is reconnecting; the handler
      // above ignores the duplicate by ID.
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
      setDraft('');
      void loadConversations();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to send message.'); }
  };

  if (!isAuthenticated) return <section className="chats-page"><h1>Chats</h1><div className="chats-empty">Sign in to contact the VEYO manager.</div></section>;

  const isOwnMessage = (senderId: string) => String(senderId).toLowerCase() === String(user?.id ?? '').toLowerCase();
  const chatsTitle = isManager ? 'Seller chats' : 'Chats with managers';

  return <section className="chats-page">
    <h1>{chatsTitle}</h1>
    <div className="chats-layout">
      <aside className="chats-list">
        <h2>{chatsTitle}</h2>
        {conversations.length ? conversations.map(conversation => <button key={conversation.listingId} type="button" className={`chat-thread ${selectedId === conversation.listingId ? 'active' : ''}`} onClick={() => setSelectedId(conversation.listingId)}>
          <strong>{conversation.title}</strong><span>{conversation.lastMessage}</span>{conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
        </button>) : <p>No conversations yet. A chat opens when a manager requests information about your listing.</p>}
      </aside>
      <div className="chat-window">
        {selectedId ? <>
          <header><div><span>Conversation about</span><h2>{title}</h2></div></header>
          <div className="chat-messages">{messages.length ? messages.map(message => <article key={message.id} className={`chat-message ${isOwnMessage(message.senderId) ? 'mine' : ''}`}><strong>{isOwnMessage(message.senderId) ? 'You' : message.senderName}</strong><p>{message.text}</p><time>{new Date(message.createdAt).toLocaleString()}</time></article>) : <p className="chats-empty">Start the conversation by asking for the missing details.</p>}</div>
          <form onSubmit={send} className="chat-compose"><textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} placeholder="Write a message…" /><button type="submit" disabled={!draft.trim()}>Send</button></form>
        </> : <div className="chats-empty">Select a conversation to view messages.</div>}
        {error && <p className="chat-error">{error}</p>}
      </div>
    </div>
  </section>;
};

export default ChatsPage;

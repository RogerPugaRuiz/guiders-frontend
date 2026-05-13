import { Injectable } from '@angular/core';
import type { Chat, Message, User } from '@guiders-frontend/shared/types';
import { BehaviorSubject, Observable } from 'rxjs';

export const SELF_CHAT_STORAGE_PREFIX = 'guiders_self_chat_';

export interface SelfChatSnapshot {
  chat: Chat;
  messages: Message[];
}

export interface SelfChatUser {
  sub: string;
  email: string;
}

/**
 * Manages a per-user "self chat" persisted in localStorage.
 * Echo-only: storing the user's own messages without any auto-reply.
 * Pinned at the top, visible across all conversation filters.
 */
@Injectable({ providedIn: 'root' })
export class SelfChatService {
  private readonly _chat = new BehaviorSubject<Chat | null>(null);
  private readonly _messages = new BehaviorSubject<Message[]>([]);

  readonly chat$: Observable<Chat | null> = this._chat.asObservable();
  readonly messages$: Observable<Message[]> = this._messages.asObservable();

  /** Synchronous accessor for the current self chat (or null if not initialized). */
  get currentChat(): Chat | null {
    return this._chat.value;
  }

  private currentUserId: string | null = null;

  initialize(user: SelfChatUser): void {
    if (!user?.sub) {
      return;
    }
    this.currentUserId = user.sub;
    const key = this.storageKey(user.sub);
    const existing = this.readSnapshot(key);

    if (existing) {
      this._chat.next(existing.chat);
      this._messages.next(existing.messages);
      return;
    }

    const chat = this.buildChat(user);
    const snapshot: SelfChatSnapshot = { chat, messages: [] };
    this.writeSnapshot(key, snapshot);
    this._chat.next(chat);
    this._messages.next([]);
  }

  async sendMessage(content: string): Promise<void> {
    const chat = this._chat.value;
    if (!chat || !this.currentUserId) {
      return;
    }

    const message: Message = {
      messageId: this.generateId('msg'),
      chatId: chat.chatId,
      senderId: this.currentUserId,
      senderType: 'COMMERCIAL',
      content,
      type: 'TEXT',
      sentAt: new Date(),
      status: 'SENT',
      isRead: true,
    };

    const next = [...this._messages.value, message];
    this._messages.next(next);

    const updatedChat: Chat = {
      ...chat,
      lastMessage: message,
      updatedAt: new Date(),
    };
    this._chat.next(updatedChat);

    this.writeSnapshot(this.storageKey(this.currentUserId), {
      chat: updatedChat,
      messages: next,
    });
  }

  clear(): void {
    this._chat.next(null);
    this._messages.next([]);
    this.currentUserId = null;
  }

  private buildChat(user: SelfChatUser): Chat {
    const displayName = `${this.deriveNameFromEmail(user.email)} (Tú)`;
    const participant: User = {
      id: user.sub,
      name: displayName,
      email: user.email,
      status: 'online',
      role: 'commercial',
    };

    const now = new Date();
    return {
      chatId: `self-${user.sub}`,
      status: 'ACTIVE',
      priority: 'NORMAL',
      visitorId: user.sub,
      commercialId: user.sub,
      unreadCount: 0,
      isTyping: false,
      typingUsers: [],
      createdAt: now,
      updatedAt: now,
      participants: [participant],
      name: displayName,
      archived: false,
      muted: false,
      pinned: true,
    };
  }

  private deriveNameFromEmail(email: string): string {
    const local = (email ?? '').split('@')[0] ?? '';
    if (!local) {
      return 'Tú';
    }
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  private storageKey(userId: string): string {
    return `${SELF_CHAT_STORAGE_PREFIX}${userId}`;
  }

  private readSnapshot(key: string): SelfChatSnapshot | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SelfChatSnapshot;
      // Revive Date instances
      parsed.chat.createdAt = new Date(parsed.chat.createdAt);
      parsed.chat.updatedAt = new Date(parsed.chat.updatedAt);
      if (parsed.chat.lastMessage?.sentAt) {
        parsed.chat.lastMessage.sentAt = new Date(parsed.chat.lastMessage.sentAt);
      }
      parsed.messages = parsed.messages.map((m) => ({
        ...m,
        sentAt: new Date(m.sentAt),
      }));
      return parsed;
    } catch {
      return null;
    }
  }

  private writeSnapshot(key: string, snapshot: SelfChatSnapshot): void {
    try {
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // ignore quota / serialization errors
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

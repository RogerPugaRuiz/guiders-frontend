import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  SELF_CHAT_STORAGE_PREFIX,
  SelfChatService,
  type SelfChatSnapshot,
} from './self-chat.service';

interface SessionUser {
  sub: string;
  email: string;
}

const USER: SessionUser = {
  sub: 'user-123',
  email: 'roger.puga@example.com',
};

const storageKey = `${SELF_CHAT_STORAGE_PREFIX}${USER.sub}`;

describe('SelfChatService', () => {
  let service: SelfChatService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelfChatService);
  });

  it('exposes a stable storage prefix', () => {
    expect(SELF_CHAT_STORAGE_PREFIX).toBe('guiders_self_chat_');
  });

  it('initialize() creates a pinned self chat for the user', async () => {
    service.initialize(USER);

    const chat = await firstValueFrom(service.chat$.pipe(take(1)));
    expect(chat).not.toBeNull();
    expect(chat?.pinned).toBe(true);
    expect(chat?.participants).toHaveLength(1);
    expect(chat?.participants[0].id).toBe(USER.sub);
    // name derived from email + " (Tú)" suffix
    expect(chat?.participants[0].name).toBe('Roger.puga (Tú)');
    expect(chat?.name).toBe('Roger.puga (Tú)');
  });

  it('initialize() persists snapshot in localStorage under user-scoped key', () => {
    service.initialize(USER);

    const raw = localStorage.getItem(storageKey);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!) as SelfChatSnapshot;
    expect(parsed.chat.chatId).toBeTruthy();
    expect(parsed.chat.pinned).toBe(true);
    expect(parsed.messages).toEqual([]);
  });

  it('initialize() rehydrates an existing snapshot instead of overwriting it', async () => {
    service.initialize(USER);
    await service.sendMessage('hola mundo');

    // New service instance simulating reload
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(SelfChatService);
    reloaded.initialize(USER);

    const messages = await firstValueFrom(reloaded.messages$.pipe(take(1)));
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('hola mundo');
    expect(messages[0].senderId).toBe(USER.sub);
  });

  it('sendMessage() appends echo message and persists, no auto-reply', async () => {
    service.initialize(USER);
    await service.sendMessage('primer mensaje');
    await service.sendMessage('segundo mensaje');

    const messages = await firstValueFrom(service.messages$.pipe(take(1)));
    expect(messages).toHaveLength(2);
    expect(messages.map((m) => m.content)).toEqual([
      'primer mensaje',
      'segundo mensaje',
    ]);
    expect(messages.every((m) => m.senderId === USER.sub)).toBe(true);
    expect(messages.every((m) => m.senderType === 'COMMERCIAL')).toBe(true);

    const persisted = JSON.parse(
      localStorage.getItem(storageKey)!
    ) as SelfChatSnapshot;
    expect(persisted.messages).toHaveLength(2);
  });

  it('uses a different storage key per user', () => {
    service.initialize(USER);
    service.initialize({ sub: 'other-user', email: 'other@example.com' });

    expect(localStorage.getItem(storageKey)).not.toBeNull();
    expect(
      localStorage.getItem(`${SELF_CHAT_STORAGE_PREFIX}other-user`)
    ).not.toBeNull();
  });

  it('clear() resets in-memory state but keeps localStorage snapshot', async () => {
    service.initialize(USER);
    await service.sendMessage('persistido');

    service.clear();

    const chat = await firstValueFrom(service.chat$.pipe(take(1)));
    const messages = await firstValueFrom(service.messages$.pipe(take(1)));
    expect(chat).toBeNull();
    expect(messages).toEqual([]);
    expect(localStorage.getItem(storageKey)).not.toBeNull();
  });
});

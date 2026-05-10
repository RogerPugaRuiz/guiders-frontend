/**
 * ChatTourSandboxLifecycleHook bridges the shared tour engine with the
 * chat domain's sandbox. It is the only place that knows about both
 * `TourSandboxService` and `ChatService`, keeping `shared/util/tour` free
 * of `scope:chat` imports.
 *
 * Responsibilities:
 * - On `console` tour start: activate the sandbox, mirror the demo chat
 *   into ChatService state, and seed the initial visitor message so the
 *   inbox UI renders the demo conversation without any extra changes.
 * - On `console` tour end (or driver close): remove the demo chat from
 *   ChatService and deactivate the sandbox to release timers and state.
 * - The `admin` tour is a no-op for chat data.
 *
 * Registered globally via {@link CHAT_TOUR_SANDBOX_HOOK_PROVIDER}.
 */
import { Injectable, Provider, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChatService } from '@guiders-frontend/chat-service';
import {
  TOUR_LIFECYCLE_HOOKS,
  TourId,
  TourLifecycleHook,
} from '@guiders-frontend/shared/util/tour';
import { DEMO_CHAT_ID, TourSandboxService } from './tour-sandbox';

@Injectable({ providedIn: 'root' })
export class ChatTourSandboxLifecycleHook implements TourLifecycleHook {
  private readonly sandbox = inject(TourSandboxService);
  private readonly chatService = inject(ChatService);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onTourStart(tourId: TourId, _userId: string): Promise<void> {
    if (tourId !== 'console') return;

    // 1. Activate sandbox so its observables emit the demo entities and
    //    the `isActive` signal flips for any consumer that branches on it.
    this.sandbox.activate();

    // 2. Mirror the demo chat + initial visitor message into ChatService
    //    state. The inbox UI consumes ChatService.chats$/messages$ — by
    //    pushing the demo data through the same wrappers used by tests
    //    (addDemoChat / setDemoMessages) the inbox renders the demo chat
    //    with zero rendering changes.
    const demoChat = await firstValueFrom(this.sandbox.chats$);
    const demoMessagesMap = await firstValueFrom(this.sandbox.messages$);

    if (demoChat[0]) {
      this.chatService.addDemoChat(demoChat[0]);
    }
    const initialMessages = demoMessagesMap[DEMO_CHAT_ID] ?? [];
    this.chatService.setDemoMessages(DEMO_CHAT_ID, initialMessages);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onTourEnd(tourId: TourId, _userId: string): Promise<void> {
    if (tourId !== 'console') return;

    // Remove demo chat first so the inbox unmounts the demo conversation
    // before the sandbox observables go empty (avoids a render flash with
    // a stale id pointing to nothing).
    this.chatService.removeDemoChat(DEMO_CHAT_ID);
    this.sandbox.deactivate();
  }
}

/**
 * Convenience provider to register the hook into the shared tour engine.
 * Add this to `app.config.ts` providers array of any app that should run
 * the console tour with chat sandbox integration (currently: console).
 */
export const CHAT_TOUR_SANDBOX_HOOK_PROVIDER: Provider = {
  provide: TOUR_LIFECYCLE_HOOKS,
  useExisting: ChatTourSandboxLifecycleHook,
  multi: true,
};

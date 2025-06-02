import { Injectable } from '@angular/core';
import { ChatData, ChatListResponse } from '../models/chat.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  getChats(params: { include: string[] }): Observable<ChatListResponse> {
    // Simula una llamada a la API
    return new Observable<ChatListResponse>(observer => {
      setTimeout(() => {
        // Simulamos datos de ejemplo o un error
        if (Math.random() > 0.9) {
          observer.error('Error al cargar las conversaciones. Inténtalo de nuevo.');
          return;
        }
        
        const mockChats: ChatData[] = [
          {
            id: '1',
            participants: [
              {
                id: 'visitor-1',
                name: 'Ana Rodríguez',
                role: 'visitor',
                isOnline: true,
                joinedAt: new Date(Date.now() - 3600000)
              },
              {
                id: 'commercial-1',
                name: 'Carlos Vendedor',
                role: 'commercial',
                isOnline: true,
                joinedAt: new Date(Date.now() - 3500000)
              }
            ],
            status: 'active',
            lastMessage: {
              id: 'msg-1',
              chatId: '1',
              senderId: 'visitor-1',
              senderName: 'Ana Rodríguez',
              content: 'Sí, por favor. También me gustaría saber los precios y disponibilidad para la primera semana de junio.',
              type: 'text',
              timestamp: new Date(Date.now() - 900000),
              isRead: true
            },
            createdAt: new Date(Date.now() - 3600000),
            updatedAt: new Date(Date.now() - 900000)
          },
          {
            id: '2',
            participants: [
              {
                id: 'visitor-2',
                name: 'Juan Pérez',
                role: 'visitor',
                isOnline: false,
                joinedAt: new Date(Date.now() - 7200000)
              },
              {
                id: 'commercial-1',
                name: 'Carlos Vendedor',
                role: 'commercial',
                isOnline: true,
                joinedAt: new Date(Date.now() - 7100000)
              }
            ],
            status: 'inactive',
            lastMessage: {
              id: 'msg-2',
              chatId: '2',
              senderId: 'commercial-1',
              senderName: 'Carlos Vendedor',
              content: '¿Hay algo más en lo que pueda ayudarte hoy?',
              type: 'text',
              timestamp: new Date(Date.now() - 3600000),
              isRead: false
            },
            createdAt: new Date(Date.now() - 7200000),
            updatedAt: new Date(Date.now() - 3600000)
          }
        ];
        
        observer.next({
          data: mockChats,
          pagination: {
            hasMore: false,
            limit: 10,
            total: 2
          }
        });
        observer.complete();
      }, 1500);
    });
  }
}

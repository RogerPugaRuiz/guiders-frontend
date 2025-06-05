import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { ChatData, MessagesListResponse } from '../../models/chat.models';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-chat-messages',
  imports: [],
  standalone: true,
  templateUrl: './chat-messages.html',
  styleUrl: './chat-messages.scss'
})
export class ChatMessages {
  private readonly http = inject(HttpClient);
  // Input usando signals (Angular 20)
  selectedChat = input<ChatData | null>(null);

  limit = signal(20);
  cursor = signal<string>('');

  messagesResource = httpResource<MessagesListResponse>(() => {
    if (!this.selectedChat()) return undefined;      
    return {
      url: `${environment.apiUrl}/chats/${this.selectedChat()?.id}/messages`,
      method: 'GET',
      params: {
        limit: this.limit(),
        cursor: this.cursor()
      }
    };
  });

  message = linkedSignal(() => {
    const chat = this.selectedChat();
    if (!chat) return [];
    return this.messagesResource.value()?.messages || [];
  });

  // Método para formatear la hora del mensaje
  formatMessageTime(createdAt: string): string {
    if (!createdAt) return '';
    
    const date = new Date(createdAt);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Método para determinar si el mensaje es enviado o recibido
  isMessageSent(senderId: string): boolean {
    const chat = this.selectedChat();
    if (!chat) return false;
    
    const visitor = chat.participants.find(p => p.isVisitor);
    return senderId !== visitor?.id;
  }

  // Función para generar separadores de fecha dinámicos
  getDateSeparator(date: string | Date): string {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Normalizar fechas para comparar solo día/mes/año (sin hora)
    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const normalizedMessageDate = normalizeDate(messageDate);
    const normalizedToday = normalizeDate(today);
    const normalizedYesterday = normalizeDate(yesterday);
    
    // Si es hoy
    if (normalizedMessageDate.getTime() === normalizedToday.getTime()) {
      return 'Hoy';
    }
    
    // Si es ayer
    if (normalizedMessageDate.getTime() === normalizedYesterday.getTime()) {
      return 'Ayer';
    }
    
    // Calcular diferencia en días
    const diffTime = normalizedToday.getTime() - normalizedMessageDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Si está dentro de la semana (últimos 7 días)
    if (diffDays > 0 && diffDays <= 7) {
      const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      return daysOfWeek[messageDate.getDay()];
    }
    
    // Si no está dentro de la semana, mostrar fecha completa
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const day = messageDate.getDate();
    const month = months[messageDate.getMonth()];
    const year = messageDate.getFullYear();
    
    return `${day} de ${month} de ${year}`;
  }

  // Función para agrupar mensajes por fecha
  getGroupedMessages() {
    const messages = this.message();
    if (!messages || messages.length === 0) return [];
    
    const groups: { date: string, dateLabel: string, messages: any[] }[] = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt);
      const dateKey = messageDate.toDateString(); // Usar como clave única para agrupar
      const dateLabel = this.getDateSeparator(message.createdAt);
      
      let existingGroup = groups.find(group => group.date === dateKey);
      
      if (!existingGroup) {
        existingGroup = {
          date: dateKey,
          dateLabel: dateLabel,
          messages: []
        };
        groups.push(existingGroup);
      }
      
      existingGroup.messages.push(message);
    });
    
    return groups;
  }
}

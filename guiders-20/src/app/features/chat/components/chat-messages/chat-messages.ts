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

  // Método para formatear la hora del mensaje considerando UTC
  formatMessageTime(createdAt: string): string {
    if (!createdAt) return '';
    
    // Crear fecha desde string ISO (que viene del servidor en UTC)
    const date = new Date(createdAt);
    
    // Convertir a zona horaria local del usuario
    const localHours = date.getHours().toString().padStart(2, '0');
    const localMinutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${localHours}:${localMinutes}`;
  }

  // Método para determinar si el mensaje es enviado o recibido
  isMessageSent(senderId: string): boolean {
    const chat = this.selectedChat();
    if (!chat) return false;
    
    const visitor = chat.participants.find(p => p.isVisitor);
    return senderId !== visitor?.id;
  }

  // Función para generar separadores de fecha dinámicos considerando UTC
  getDateSeparator(date: string | Date): string {
    if (!date) return '';
    
    // Crear fecha desde string ISO (UTC) y convertir a zona horaria local
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Normalizar fechas para comparar solo día/mes/año en zona horaria local
    const normalizeDate = (d: Date) => {
      const localDate = new Date(d.getTime());
      return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
    };
    
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
    
    // Si no está dentro de la semana, mostrar fecha completa en zona horaria local
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const day = messageDate.getDate();
    const month = months[messageDate.getMonth()];
    const year = messageDate.getFullYear();
    
    return `${day} de ${month} de ${year}`;
  }

  // Función para agrupar mensajes por fecha en zona horaria local
  getGroupedMessages() {
    const messages = this.message();
    if (!messages || messages.length === 0) return [];
    
    // Primero ordenar todos los mensajes por fecha (más antiguos primero)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const groups: { date: string, dateLabel: string, messages: any[] }[] = [];
    
    sortedMessages.forEach(message => {
      // Convertir UTC a zona horaria local
      const messageDate = new Date(message.createdAt);
      
      // Crear clave única basada en fecha local (año-mes-día)
      const dateKey = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`;
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
    
    // Los grupos ya están ordenados por fecha (más antiguos primero)
    // Los mensajes dentro de cada grupo también están ordenados (más antiguos primero)
    return groups;
  }
}

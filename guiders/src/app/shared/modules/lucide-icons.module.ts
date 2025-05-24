import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  // Importa solo los iconos que necesitas para reducir el tamaño del bundle
  User, 
  Settings, 
  MessageSquare, 
  Bell, 
  Moon, 
  Sun, 
  LogOut,
  // Puedes añadir más iconos según tus necesidades
} from 'lucide-angular';

// Crea un array con todos los iconos que vas a utilizar
const icons = [
  User,
  Settings,
  MessageSquare,
  Bell,
  Moon,
  Sun,
  LogOut,
  // Añade más iconos aquí según los necesites
];

@NgModule({
  imports: [
    CommonModule,
    ...icons,
  ],
  exports: [
    ...icons,
  ]
})
export class LucideIconsModule { }

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Componente de menú lateral simplificado para Angular 20
 * Usando template estático con RouterLink y RouterLinkActive
 */
@Component({
  selector: 'app-side-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-menu.html',
  styleUrl: './side-menu.scss'
})
export class SideMenu {
  // Componente simplificado - el menú se maneja directamente en el template
}

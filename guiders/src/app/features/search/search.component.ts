import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  `,
  styles: ['./search.component.scss']
})
export class SearchComponent {
  searchQuery: string = '';
  searchResults: any[] = [];
}

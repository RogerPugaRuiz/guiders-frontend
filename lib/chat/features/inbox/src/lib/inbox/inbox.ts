import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'chat-inbox',
  imports: [],
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
})
export class Inbox {
  private router = inject(Router);
}

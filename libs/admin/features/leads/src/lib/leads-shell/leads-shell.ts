import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'guiders-leads-shell',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './leads-shell.html',
  styleUrl: './leads-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadsShell {}

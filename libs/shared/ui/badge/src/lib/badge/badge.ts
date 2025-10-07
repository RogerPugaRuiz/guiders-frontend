import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeShape = 'rounded' | 'pill' | 'square';

@Component({
  selector: 'guiders-badge',
  imports: [CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  // === INPUTS ===
  readonly variant = input<BadgeVariant>('default');
  readonly size = input<BadgeSize>('medium');
  readonly shape = input<BadgeShape>('rounded');
  readonly text = input<string>('');
  readonly count = input<number>();
  readonly maxCount = input<number>(99);
  readonly dot = input<boolean>(false);
  readonly outline = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  // === COMPUTED VALUES ===
  readonly badgeClasses = computed(() => ({
    'guiders-badge': true,
    [`guiders-badge--${this.variant()}`]: true,
    [`guiders-badge--${this.size()}`]: true,
    [`guiders-badge--${this.shape()}`]: true,
    'guiders-badge--outline': this.outline(),
    'guiders-badge--dot': this.dot(),
    'guiders-badge--disabled': this.disabled(),
    'guiders-badge--empty': this.isEmpty()
  }));

  readonly displayText = computed(() => {
    const count = this.count();
    const text = this.text();
    const maxCount = this.maxCount();

    if (this.dot()) {
      return '';
    }

    if (count !== undefined) {
      return count > maxCount ? `${maxCount}+` : count.toString();
    }

    return text;
  });

  readonly isEmpty = computed(() => {
    const text = this.text();
    const count = this.count();
    return !this.dot() && !text && count === undefined;
  });

  readonly ariaLabelValue = computed(() => {
    const customLabel = this.ariaLabel();
    if (customLabel) {
      return customLabel;
    }

    const count = this.count();
    const text = this.text();
    const variant = this.variant();

    if (this.dot()) {
      return `Indicador de estado ${variant}`;
    }

    if (count !== undefined) {
      const maxCount = this.maxCount();
      if (count > maxCount) {
        return `Más de ${maxCount} elementos`;
      }
      return count === 1 ? `${count} elemento` : `${count} elementos`;
    }

    if (text) {
      return `Etiqueta: ${text}`;
    }

    return `Badge ${variant}`;
  });
}

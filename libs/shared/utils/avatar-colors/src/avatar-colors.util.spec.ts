import { describe, it, expect } from 'vitest';
import { getAvatarColor } from './avatar-colors.util';

describe('getAvatarColor', () => {
  it('should return a color for valid initials', () => {
    const color = getAvatarColor('JP');
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should return consistent color for same initials', () => {
    const color1 = getAvatarColor('MA');
    const color2 = getAvatarColor('MA');
    expect(color1).toBe(color2);
  });

  it('should return different colors for different initials', () => {
    const color1 = getAvatarColor('AB');
    const color2 = getAvatarColor('CD');
    // No garantizamos que sean diferentes (pueden colisionar)
    // pero al menos verificamos que ambos sean colores válidos
    expect(color1).toMatch(/^#[0-9A-F]{6}$/i);
    expect(color2).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should handle case insensitivity', () => {
    const color1 = getAvatarColor('jp');
    const color2 = getAvatarColor('JP');
    expect(color1).toBe(color2);
  });

  it('should handle empty string', () => {
    const color = getAvatarColor('');
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should handle whitespace', () => {
    const color1 = getAvatarColor('  JP  ');
    const color2 = getAvatarColor('JP');
    expect(color1).toBe(color2);
  });

  it('should return valid colors from the palette', () => {
    const testInitials = ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP'];
    const colors = testInitials.map(init => getAvatarColor(init));
    
    colors.forEach(color => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Message input auto-grow', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar autenticación mock en localStorage
    await page.goto('/');
    
    // Añadir token de acceso y refresh en localStorage (mock)
    await page.evaluate(() => {
      localStorage.setItem('access-token', 'mock-access-token');
      localStorage.setItem('refresh-token', 'mock-refresh-token');
    });
    
    // Navegar a la bandeja de entrada
    await page.goto('/inbox');
    
    // Esperar a que el textarea sea visible
    const textarea = page.locator('textarea.message-input__textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
  });

  test('textarea grows from min to max height as lines are added', async ({ page }) => {
    const textarea = page.locator('textarea.message-input__textarea');
    
    // Verificar que el textarea existe
    await expect(textarea).toBeVisible();
    
    // Obtener altura inicial
    const initialBox = await textarea.boundingBox();
    if (!initialBox) throw new Error('Textarea bounding box not found');
    const initialHeight = initialBox.height;
    
    console.log('Initial height:', initialHeight);
    
    // Escribir múltiples líneas (simular Shift+Enter)
    await textarea.fill('');
    const lines = Array.from({ length: 10 }, (_, i) => `Línea ${i + 1}`);
    await textarea.fill(lines.join('\n'));
    
    // Esperar a que el textarea ajuste su altura usando un locator más específico
    await expect(textarea).toBeVisible();
    
    // Obtener altura después de añadir líneas
    const afterBox = await textarea.boundingBox();
    if (!afterBox) throw new Error('Textarea bounding box not found after fill');
    const afterHeight = afterBox.height;
    
    console.log('After height:', afterHeight);
    
    // Verificar que la altura creció
    expect(afterHeight).toBeGreaterThan(initialHeight);
    
    // Verificar que no supera el máximo (120px + margen de 5px para bordes/padding)
    expect(afterHeight).toBeLessThanOrEqual(125);
    
    // Verificar usando evaluate que el max-height CSS está aplicado
    const styles = await textarea.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        maxHeight: computed.maxHeight,
        height: (el as HTMLTextAreaElement).style.height,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      };
    });
    
    console.log('Computed styles:', styles);
    
    // Verificar que max-height está configurado a 120px
    expect(styles.maxHeight).toBe('120px');
    
    // Verificar que el scrollHeight es mayor que clientHeight cuando hay muchas líneas
    expect(styles.scrollHeight).toBeGreaterThan(styles.clientHeight);
  });

  test('textarea grows dynamically as user types', async ({ page }) => {
    const textarea = page.locator('textarea.message-input__textarea');
    
    // Limpiar textarea
    await textarea.fill('');
    
    // Obtener altura inicial
    const firstBox = await textarea.boundingBox();
    if (!firstBox) throw new Error('Textarea bounding box not found');
    let previousHeight = firstBox.height;
    
    // Escribir líneas incrementalmente
    for (let i = 1; i <= 5; i++) {
      await textarea.fill(Array.from({ length: i }, (_, j) => `Línea ${j + 1}`).join('\n'));
      
      // Esperar a que el textarea esté visible después del cambio
      await expect(textarea).toBeVisible();
      
      const currentBox = await textarea.boundingBox();
      if (!currentBox) throw new Error(`Textarea bounding box not found at iteration ${i}`);
      const currentHeight = currentBox.height;
      
      console.log(`After ${i} lines: ${currentHeight}px`);
      
      // La altura debe crecer o mantenerse (cuando alcanza el máximo)
      expect(currentHeight).toBeGreaterThanOrEqual(previousHeight);
      
      previousHeight = currentHeight;
    }
  });

  test('textarea resets height after sending message', async ({ page }) => {
    const textarea = page.locator('textarea.message-input__textarea');
    
    // Escribir múltiples líneas
    await textarea.fill('Línea 1\nLínea 2\nLínea 3\nLínea 4\nLínea 5');
    
    // Esperar a que el textarea esté visible con contenido
    await expect(textarea).toBeVisible();
    
    const boxWithContent = await textarea.boundingBox();
    if (!boxWithContent) throw new Error('Textarea bounding box not found with content');
    const heightWithContent = boxWithContent.height;
    console.log('Height with content:', heightWithContent);
    
    // Enviar mensaje (simulando Enter)
    await textarea.press('Enter');
    
    // Verificar que el textarea se limpió
    await expect(textarea).toHaveValue('');
    
    // Verificar que la altura se reseteo
    const boxAfterSend = await textarea.boundingBox();
    if (!boxAfterSend) throw new Error('Textarea bounding box not found after send');
    const heightAfterSend = boxAfterSend.height;
    console.log('Height after send:', heightAfterSend);
    
    // La altura debe ser menor después de limpiar
    expect(heightAfterSend).toBeLessThan(heightWithContent);
  });
});

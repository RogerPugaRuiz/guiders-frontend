describe('Jest Setup', () => {
  it('should be configured correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have localStorage mock', () => {
    expect(window.localStorage.getItem).toBeDefined();
    expect(typeof window.localStorage.getItem).toBe('function');
  });

  it('should have matchMedia mock', () => {
    expect(window.matchMedia).toBeDefined();
    expect(typeof window.matchMedia).toBe('function');
  });
});

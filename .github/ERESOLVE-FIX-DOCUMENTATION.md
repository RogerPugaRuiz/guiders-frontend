# 🔧 Solución para ERESOLVE Error en GitHub Actions

## 📋 Problema Identificado

El workflow de GitHub Actions fallaba con un error ERESOLVE durante la instalación de dependencias con `npm ci`. El conflicto era entre:

- `@angular/core@20.0.0` (Angular 20)
- `@ngrx/signals@19.2.1` (requiere Angular 19)

## ✅ Soluciones Implementadas

### 1. **Actualización del Workflow de GitHub Actions**

**Archivo:** `.github/workflows/deploy.yml`

```yaml
# Antes
- name: 📦 Install root dependencies
  run: npm ci

- name: 📦 Install Guiders-20 dependencies
  run: |
    cd guiders-20
    npm ci

# Después
- name: 📦 Install root dependencies
  run: npm ci --legacy-peer-deps

- name: 📦 Install Guiders-20 dependencies
  run: |
    cd guiders-20
    npm ci --legacy-peer-deps
```

### 2. **Configuración de Overrides en package.json**

**Archivo:** `guiders-20/package.json`

```json
{
  "overrides": {
    "@angular/core": "^20.0.0",
    "@angular/common": "^20.0.0",
    "@angular/platform-browser": "^20.0.0"
  }
}
```

### 3. **Mantener Versiones Existentes**

Se mantuvo `@ngrx/signals@19.2.1` ya que la versión 20.0.0 aún no está disponible en npm.

## 🧪 Verificación Local

### Comandos Ejecutados:
```bash
# Limpiar instalación anterior
rm -rf node_modules package-lock.json

# Instalar con flag de compatibilidad
npm install --legacy-peer-deps

# Verificar que el build funcione
npm run build:prod
```

### ✅ Resultados:
- ✅ Instalación exitosa sin errores ERESOLVE
- ✅ Build de producción completado
- ✅ Tanto cliente como servidor SSR generados correctamente
- ⚠️ Solo warnings menores sobre CommonJS modules (no críticos)

## 🔍 Análisis de la Solución

### **--legacy-peer-deps Flag**
- **Qué hace:** Usa el algoritmo de resolución de dependencias de npm v6
- **Por qué funciona:** Es más permisivo con conflictos de peer dependencies
- **Cuándo usar:** Cuando tienes dependencias que no han actualizado sus peer dependencies

### **Overrides Section**
- **Qué hace:** Fuerza versiones específicas de paquetes en toda la dependency tree
- **Por qué necesario:** Asegura que Angular 20 se use en toda la aplicación
- **Ventaja:** Evita conflictos de versiones múltiples

## 📊 Impacto en el Deployment

### **Cambios en CI/CD:**
- El workflow ahora usa `--legacy-peer-deps` consistentemente
- La instalación será más lenta pero más confiable
- Se evitan fallos por conflictos de peer dependencies

### **Consideraciones Futuras:**
- Monitorear cuando `@ngrx/signals@20.x` esté disponible
- Actualizar a la nueva versión cuando sea compatible
- Revisar si se puede remover `--legacy-peer-deps` en futuras versiones

## 🚀 Próximos Pasos

1. **Probar el Workflow:** Hacer push a `main` para verificar que el deployment funcione
2. **Monitorear @ngrx/signals:** Estar atento a la versión 20.x
3. **Optimizar Build:** Considerar configurar `allowedCommonJsDependencies` para eliminar warnings

## 📚 Referencias

- [npm legacy-peer-deps documentation](https://docs.npmjs.com/cli/v7/using-npm/config#legacy-peer-deps)
- [npm overrides documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)
- [Angular 20 Migration Guide](https://angular.dev/reference/migrations)

## 🎯 Comandos Útiles para Debugging

```bash
# Verificar árbol de dependencias
npm ls @ngrx/signals

# Verificar conflictos
npm ls --depth=0

# Instalar con verbose para debug
npm install --legacy-peer-deps --verbose

# Verificar versiones disponibles
npm view @ngrx/signals versions --json
```

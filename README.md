# 🏗️ Tracker de Obras

Aplicación web para llevar control detallado de obras en casa. 

## ✨ Funcionalidades

- ✅ Registro de compra de materiales
- ✅ Control de pagos semanales
- ✅ Conversión de dólares a pesos argentinos
- ✅ Filtros por categoría
- ✅ Gestión de presupuestos con items
- ✅ Edición completa de items de presupuesto
- ✅ Historial de items comprados
- ✅ Exportar/Importar datos
- ✅ Reportes y resumen detallado
- 📊 **NUEVO**: Dashboard con gráficas interactivas
- 📱 **NUEVO**: Optimizado para dispositivos móviles
- 🔥 Integración con Firebase

## 📊 Dashboard Interactivo

El nuevo dashboard incluye:

1. **Tarjetas de Resumen**
   - Costo total de la obra
   - Total de gastos
   - Total de presupuestos comprados
   - Total de pagos a mano de obra

2. **Gráficas Visuales**
   - 🍩 Distribución de gastos por categoría (incluyendo presupuestos)
   - 📊 Presupuestado vs Real por presupuesto
   - 📈 Evolución temporal de gastos por mes
   - 💳 Métodos de pago (Efectivo vs Tarjeta)
   - 📦 Estado de items (Comprados vs Pendientes)
   - 🏆 Top 10 categorías con mayor gasto

3. **Características**
   - Gráficas interactivas con Chart.js
   - Responsive design para móviles
   - Actualización automática con los datos
   - Tooltips informativos con porcentajes y montos

## 🚀 Inicio Rápido

### Opción 1: Sin Base de Datos (Solo navegador)

1. Abre `index.html` en tu navegador
2. Los datos se guardan en localStorage (solo en tu dispositivo)
3. Usa Exportar/Importar para hacer backups

### Opción 2: Con Firebase (Recomendado)

1. **Lee la guía completa**: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Crea un proyecto en Firebase
3. Configura Firestore Database
4. Actualiza `firebase-config.js` con tus credenciales
5. En `index.html`, cambia de `app.js` a `app-firebase.js`
6. ¡Disfruta de sincronización en la nube! ☁️

## 📁 Estructura del Proyecto

```
obra-tracker/
├── index.html              # Página principal
├── styles.css              # Estilos
├── app.js                  # App sin Firebase (localStorage)
├── app-firebase.js         # App con Firebase
├── firebase-config.js      # Configuración de Firebase
├── FIREBASE_SETUP.md       # Guía de Firebase
└── README.md              # Este archivo
```

## 🎯 Características Técnicas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Almacenamiento Local**: localStorage API
- **Base de Datos Cloud**: Firebase Firestore (opcional)
- **Responsive**: Diseñado para móvil y escritorio
- **Sin dependencias**: No requiere build ni npm

## 📱 Navegación

La aplicación tiene 5 pestañas principales:

1. **💰 Nuevo Gasto** - Registra compras de materiales
2. **👷 Nuevo Pago** - Registra pagos a trabajadores
3. **💵 Nuevo Cambio** - Registra conversiones de moneda
4. **📊 Nuevo Avance** - Registra el progreso de la obra
5. **📋📈 Historial y Resumen** - Ver todo y estadísticas

## 🌐 Publicar Online

### GitHub Pages (Gratis)

1. Crea un repositorio en GitHub
2. Sube estos archivos
3. Ve a Settings > Pages
4. Selecciona la rama `main` y carpeta `/ (root)`
5. Accede a: `https://tuusuario.github.io/obra-tracker/`

### Firebase Hosting (Gratis)

Si usas Firebase, también puedes usar su hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🔐 Seguridad

### Sin Firebase
- Los datos están solo en tu navegador
- Haz backups regularmente con Exportar

### Con Firebase
- Configura reglas de seguridad en Firestore
- Considera implementar autenticación
- Lee [FIREBASE_SETUP.md](FIREBASE_SETUP.md) para más detalles

## 🛠️ Desarrollo

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz tus cambios
4. Commit: `git commit -m 'feat: descripción'`
5. Push: `git push origin feature/nueva-funcionalidad`
6. Abre un Pull Request

## 📝 Changelog

### v2.0.0 (2026-01-19)
- ✨ Integración con Firebase Firestore
- ✨ Navegación por pestañas mejorada
- ✨ Combinación de Historial y Resumen en una pestaña
- 🐛 Corrección de CSS para ocultar/mostrar tabs

### v1.0.0 (Inicial)
- ✅ Funcionalidades básicas
- ✅ localStorage para persistencia

## 📄 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo y modificarlo.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## 📞 Soporte

Si tienes problemas:
1. Revisa [FIREBASE_SETUP.md](FIREBASE_SETUP.md) para configuración de Firebase
2. Abre un issue en GitHub
3. Revisa la consola del navegador (F12) para errores

---

Hecho con ❤️ para facilitar el control de obras de construcción
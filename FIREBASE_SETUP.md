# 🔥 Guía de Integración con Firebase

Esta guía te ayudará a integrar Firebase con tu aplicación Obra Tracker paso a paso.

## 📋 Requisitos Previos
- Una cuenta de Google
- Navegador web
- Tu proyecto Obra Tracker

## 🚀 Paso 1: Crear Proyecto en Firebase

1. **Abre la Consola de Firebase**
   - Ve a: https://console.firebase.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear nuevo proyecto**
   - Haz clic en "Agregar proyecto" o "Add project"
   - Nombre del proyecto: `obra-tracker`
   - Deshabilita Google Analytics (opcional, para ir más rápido)
   - Haz clic en "Crear proyecto"
   - Espera a que se cree el proyecto

## 🌐 Paso 2: Registrar la App Web

1. **En tu proyecto Firebase**, haz clic en el ícono de **Web** (`</>`)
2. **Nombre de la app**: `Obra Tracker Web`
3. **NO marques** "Firebase Hosting" (por ahora)
4. Haz clic en "Registrar app"
5. **¡IMPORTANTE!** Copia la configuración que aparece, se verá así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "obra-tracker-xxxxx.firebaseapp.com",
  projectId: "obra-tracker-xxxxx",
  storageBucket: "obra-tracker-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## 🗄️ Paso 3: Configurar Firestore Database

1. **En el menú lateral**, ve a **"Firestore Database"**
2. Haz clic en **"Crear base de datos"** o **"Create database"**
3. **Modo**: Selecciona **"Comenzar en modo de prueba"** (test mode)
   - Esto permite leer/escribir sin autenticación durante 30 días
4. **Ubicación**: Selecciona la más cercana a tu ubicación (ej: `southamerica-east1`)
5. Haz clic en **"Habilitar"** o **"Enable"**

### 📝 Configurar Reglas de Seguridad (Importante después de los 30 días)

Cuando estés listo para producción, ve a la pestaña **"Reglas"** en Firestore y usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura a todos (para empezar)
    // ADVERTENCIA: Cambia esto en producción con autenticación
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Para producción**, deberías implementar Firebase Authentication y usar reglas más restrictivas.

## 🔧 Paso 4: Actualizar tu Proyecto

### 4.1 Actualizar `firebase-config.js`

1. Abre el archivo `firebase-config.js`
2. Reemplaza los valores de `firebaseConfig` con los que copiaste en el Paso 2
3. Guarda el archivo

### 4.2 Actualizar `index.html`

Agrega estos scripts **ANTES** de la etiqueta `</body>`:

```html
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    
    <!-- Configuración de Firebase -->
    <script src="firebase-config.js"></script>
    
    <!-- App con Firebase -->
    <script src="app-firebase.js"></script>
</body>
</html>
```

**Nota**: Cambia `<script src="app.js"></script>` por `<script src="app-firebase.js"></script>`

## 🔄 Paso 5: Migrar Datos Existentes (Opcional)

Si ya tienes datos en localStorage que quieres migrar a Firebase:

1. Abre la consola del navegador (F12)
2. Ejecuta este comando:

```javascript
migrateLocalStorageToFirebase()
```

3. Espera a que termine y verás el mensaje: "Datos migrados exitosamente a Firebase!"

## ✅ Paso 6: Probar la Integración

1. **Recarga la página** (F5)
2. Abre la **Consola del navegador** (F12)
3. Deberías ver: `✅ Firebase inicializado correctamente`
4. Agrega un nuevo gasto o pago
5. Ve a la **Consola de Firebase** > **Firestore Database**
6. Deberías ver las colecciones creadas: `gastos`, `pagos`, `cambios`, `avances`

## 📊 Estructura de Firestore

Tu base de datos tendrá estas colecciones:

```
obra-tracker/
├── gastos/
│   ├── documento1
│   ├── documento2
│   └── ...
├── pagos/
│   ├── documento1
│   └── ...
├── cambios/
│   ├── documento1
│   └── ...
└── avances/
    ├── documento1
    └── ...
```

Cada documento contiene los campos correspondientes a cada tipo de registro.

## 🎯 Ventajas de Firebase

✅ **Sincronización en tiempo real**: Accede desde cualquier dispositivo
✅ **Backup automático**: Tus datos están seguros en la nube
✅ **Sin servidor**: No necesitas mantener un servidor
✅ **Escalable**: Crece con tu proyecto
✅ **Gratis**: Plan generoso para empezar

## 📱 Límites del Plan Gratuito (Spark)

- **Almacenamiento**: 1 GB
- **Lecturas**: 50,000 / día
- **Escrituras**: 20,000 / día
- **Eliminaciones**: 20,000 / día

Más que suficiente para uso personal y pequeños proyectos.

## 🔐 Próximos Pasos (Opcional)

Para una aplicación más segura:

1. **Implementar Autenticación**
   - Firebase Authentication (email, Google, etc.)
   
2. **Mejorar Reglas de Seguridad**
   - Solo permitir acceso a usuarios autenticados
   
3. **Implementar Hosting**
   - Publicar tu app en Firebase Hosting
   
4. **Agregar Funciones Cloud**
   - Lógica del lado del servidor

## ❓ Solución de Problemas

### Error: "Firebase not initialized"
- Verifica que los scripts de Firebase estén cargados antes de `firebase-config.js`
- Revisa la consola para errores de red

### Error: "Permission denied"
- Verifica las reglas de Firestore
- Asegúrate de estar en modo de prueba o tener autenticación configurada

### Los datos no se muestran
- Abre la consola (F12) y busca errores
- Verifica que la configuración de Firebase sea correcta
- Revisa que Firestore esté habilitado

## 📞 Soporte

Si tienes problemas, revisa:
- Consola del navegador (F12)
- Consola de Firebase > Firestore > Datos
- Documentación oficial: https://firebase.google.com/docs

---

¡Listo! Tu aplicación ahora usa Firebase para almacenar datos en la nube. 🎉

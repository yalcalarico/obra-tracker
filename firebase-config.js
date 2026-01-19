// Firebase Configuration
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
// Los obtendrás de: Firebase Console > Project Settings > General > Your apps

const firebaseConfig = {
    apiKey: "AIzaSyDLP8e42e8DucFlhMloh-x1B21He_brC6I",
    authDomain: "obra-tracker-6a20e.firebaseapp.com",
    projectId: "obra-tracker-6a20e",
    storageBucket: "obra-tracker-6a20e.firebasestorage.app",
    messagingSenderId: "161947061102",
    appId: "1:161947061102:web:511efdcaa30ba99da54f7f",
    measurementId: "G-6B0DF18HF7"
};

// Inicializar Firebase
let db;

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        // Remover del DOM después de la animación
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function initFirebase() {
    try {
        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Inicializar Firestore
        db = firebase.firestore();
        
        console.log('✅ Firebase inicializado correctamente');
        
        // Cargar datos desde Firebase en lugar de localStorage
        loadDataFromFirebase();
        
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        // Si hay error, usar localStorage como respaldo
        loadData();
        hideLoading();
    }
}

// Cargar datos desde Firebase
async function loadDataFromFirebase() {
    try {
        // Obtener colecciones
        const gastosSnapshot = await db.collection('gastos').get();
        const pagosSnapshot = await db.collection('pagos').get();
        const cambiosSnapshot = await db.collection('cambios').get();
        const avancesSnapshot = await db.collection('avances').get();
        const presupuestoSnapshot = await db.collection('presupuesto').get();
        
        // Convertir a arrays
        data.gastos = gastosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.cambios = cambiosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.avances = avancesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Organizar presupuesto por áreas
        const presupuestoItems = presupuestoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.presupuesto = {
            baño: [],
            cocina: [],
            dormitorio: [],
            living: [],
            exterior: [],
            otros: []
        };
        
        presupuestoItems.forEach(item => {
            if (data.presupuesto[item.area]) {
                data.presupuesto[item.area].push(item);
            }
        });
        
        // Renderizar todo
        renderGastos();
        renderPagos();
        renderCambios();
        renderAvances();
        renderResumen();
        renderBudgetItems();
        renderBudgetSummary();
        
        console.log('✅ Datos cargados desde Firebase');
        
        // Ocultar loading screen
        hideLoading();
        
    } catch (error) {
        console.error('❌ Error al cargar datos desde Firebase:', error);
        // Usar localStorage como respaldo
        loadData();
        hideLoading();
    }
}

// Recargar datos desde Firebase (para sincronización)
async function reloadDataFromFirebase() {
    try {
        // Obtener colecciones
        const gastosSnapshot = await db.collection('gastos').get();
        const pagosSnapshot = await db.collection('pagos').get();
        const cambiosSnapshot = await db.collection('cambios').get();
        const avancesSnapshot = await db.collection('avances').get();
        const presupuestoSnapshot = await db.collection('presupuesto').get();
        
        // Convertir a arrays
        data.gastos = gastosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.cambios = cambiosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.avances = avancesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Organizar presupuesto por áreas
        const presupuestoItems = presupuestoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.presupuesto = {
            baño: [],
            cocina: [],
            dormitorio: [],
            living: [],
            exterior: [],
            otros: []
        };
        
        presupuestoItems.forEach(item => {
            if (data.presupuesto[item.area]) {
                data.presupuesto[item.area].push(item);
            }
        });
        
        // Renderizar todo
        renderGastos();
        renderPagos();
        renderCambios();
        renderAvances();
        renderResumen();
        renderBudgetItems();
        renderBudgetSummary();
        
        console.log('🔄 Datos recargados desde Firebase');
        
        // Mostrar notificación de éxito
        if (typeof showNotification === 'function') {
            showNotification(
                'Datos actualizados',
                'Se sincronizaron los últimos cambios',
                'success'
            );
        }
        
    } catch (error) {
        console.error('❌ Error al recargar datos desde Firebase:', error);
        if (typeof showNotification === 'function') {
            showNotification(
                'Error al actualizar',
                'No se pudieron sincronizar los datos',
                'error'
            );
        }
    }
}

// Guardar gasto en Firebase
async function saveGastoToFirebase(gasto) {
    try {
        const docRef = await db.collection('gastos').add(gasto);
        return docRef.id;
    } catch (error) {
        console.error('Error al guardar gasto:', error);
        throw error;
    }
}

// Guardar pago en Firebase
async function savePagoToFirebase(pago) {
    try {
        const docRef = await db.collection('pagos').add(pago);
        return docRef.id;
    } catch (error) {
        console.error('Error al guardar pago:', error);
        throw error;
    }
}

// Guardar cambio en Firebase
async function saveCambioToFirebase(cambio) {
    try {
        const docRef = await db.collection('cambios').add(cambio);
        return docRef.id;
    } catch (error) {
        console.error('Error al guardar cambio:', error);
        throw error;
    }
}

// Guardar avance en Firebase
async function saveAvanceToFirebase(avance) {
    try {
        const docRef = await db.collection('avances').add(avance);
        return docRef.id;
    } catch (error) {
        console.error('Error al guardar avance:', error);
        throw error;
    }
}

// Eliminar documento de Firebase
async function deleteFromFirebase(collection, id) {
    try {
        await db.collection(collection).doc(id).delete();
        console.log(`✅ Documento eliminado de ${collection}`);
    } catch (error) {
        console.error(`Error al eliminar de ${collection}:`, error);
        throw error;
    }
}

// Migrar datos de localStorage a Firebase (ejecutar una sola vez)
async function migrateLocalStorageToFirebase() {
    try {
        console.log('🔄 Migrando datos de localStorage a Firebase...');
        
        // Cargar datos de localStorage
        const localGastos = JSON.parse(localStorage.getItem('gastos')) || [];
        const localPagos = JSON.parse(localStorage.getItem('pagos')) || [];
        const localCambios = JSON.parse(localStorage.getItem('cambios')) || [];
        const localAvances = JSON.parse(localStorage.getItem('avances')) || [];
        
        // Migrar gastos
        for (const gasto of localGastos) {
            await db.collection('gastos').add(gasto);
        }
        
        // Migrar pagos
        for (const pago of localPagos) {
            await db.collection('pagos').add(pago);
        }
        
        // Migrar cambios
        for (const cambio of localCambios) {
            await db.collection('cambios').add(cambio);
        }
        
        // Migrar avances
        for (const avance of localAvances) {
            await db.collection('avances').add(avance);
        }
        
        console.log('✅ Migración completada exitosamente');
        alert('Datos migrados exitosamente a Firebase!');
        
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        alert('Error al migrar datos. Ver consola para detalles.');
    }
}

// ==================== FUNCIONES DE PRESUPUESTO ====================
async function saveBudgetItemToFirebase(item) {
    try {
        const docRef = await db.collection('presupuesto').add(item);
        console.log('✅ Item de presupuesto guardado con ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error al guardar item de presupuesto:', error);
        throw error;
    }
}

async function updateBudgetItemInFirebase(item) {
    try {
        await db.collection('presupuesto').doc(item.id).update({
            comprado: item.comprado,
            valorReal: item.valorReal
        });
        console.log('✅ Item de presupuesto actualizado');
    } catch (error) {
        console.error('❌ Error al actualizar item de presupuesto:', error);
        throw error;
    }
}

async function loadBudgetFromFirebase() {
    try {
        const snapshot = await db.collection('presupuesto').get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Organizar por áreas
        data.presupuesto = {
            baño: [],
            cocina: [],
            dormitorio: [],
            living: [],
            exterior: [],
            otros: []
        };
        
        items.forEach(item => {
            if (data.presupuesto[item.area]) {
                data.presupuesto[item.area].push(item);
            }
        });
        
        console.log('✅ Presupuesto cargado desde Firebase');
    } catch (error) {
        console.error('❌ Error al cargar presupuesto:', error);
    }
}


// Versión de app.js integrada con Firebase
// Este archivo reemplaza las funciones que usan localStorage por Firebase

// Inicializar datos
let data = {
    gastos: [],
    pagos: [],
    cambios: [],
    avances: [],
    presupuestos: [], // Array de presupuestos
    presupuestoItems: [] // Items de todos los presupuestos
};

// Variable para el presupuesto actual
let currentBudget = null;

// Variables para modo edición
let editMode = {
    active: false,
    type: null,
    id: null
};

// ==================== FUNCIONES DE FORMATO ====================
function formatCurrency(value) {
    if (value === null || value === undefined) return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    
    // Formatear con separador de miles y dos decimales
    return num.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ==================== SISTEMA DE NOTIFICACIONES ====================
function showNotification(title, message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type]}</span>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove después de 4 segundos
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ==================== SISTEMA DE CONFIRMACIÓN ====================
function showConfirm(title, message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-header">
                <span class="confirm-icon">⚠️</span>
                <h3>${title}</h3>
            </div>
            <div class="confirm-body">
                <p>${message}</p>
            </div>
            <div class="confirm-footer">
                <button class="btn-cancel" id="confirmCancel">Cancelar</button>
                <button class="btn-confirm" id="confirmOk">Eliminar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Agregar event listeners
    document.getElementById('confirmOk').addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
    });
    
    document.getElementById('confirmCancel').addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
    });
    
    // Cerrar al hacer click fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    });
}

// Función para deshabilitar/habilitar botón con loading
function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        button.dataset.originalText = button.textContent;
        button.textContent = 'Guardando...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

// ==================== FUNCIÓN DE REFRESH MANUAL ====================
function refreshData() {
    const refreshButton = document.getElementById('refreshButton');
    const loadingOverlay = document.getElementById('historialLoading');
    const lastUpdateText = document.getElementById('lastUpdate');
    
    // Deshabilitar botón y mostrar loading
    refreshButton.disabled = true;
    refreshButton.classList.add('loading');
    refreshButton.querySelector('.refresh-text').textContent = 'Sincronizando...';
    loadingOverlay.classList.remove('hidden');
    
    // Recargar datos de Firebase
    reloadDataFromFirebase()
        .then(() => {
            // Actualizar timestamp
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('es-ES');
            lastUpdateText.textContent = `Última actualización: ${timeStr} ${dateStr}`;
            
            // Ocultar loading y habilitar botón
            loadingOverlay.classList.add('hidden');
            refreshButton.disabled = false;
            refreshButton.classList.remove('loading');
            refreshButton.querySelector('.refresh-text').textContent = 'Actualizar datos';
            
            showNotification('Datos actualizados', 'Los datos se han sincronizado correctamente', 'success');
        })
        .catch((error) => {
            console.error('Error al refrescar datos:', error);
            
            // Ocultar loading y habilitar botón
            loadingOverlay.classList.add('hidden');
            refreshButton.disabled = false;
            refreshButton.classList.remove('loading');
            refreshButton.querySelector('.refresh-text').textContent = 'Actualizar datos';
            
            showNotification('Error al actualizar', 'No se pudieron sincronizar los datos. Intenta nuevamente.', 'error');
        });
}

// Cargar datos al iniciar
window.onload = function() {
    // Inicializar Firebase primero
    initFirebase();
    
    // Establecer fecha actual por defecto
    if (document.getElementById('gastoFecha')) {
        document.getElementById('gastoFecha').valueAsDate = new Date();
    }
    if (document.getElementById('cambioFecha')) {
        document.getElementById('cambioFecha').valueAsDate = new Date();
    }
};

// Manejo de tabs principales
function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar tab seleccionado
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.closest('.tab').classList.add('active');
    
    // Actualizar resumen si se abre esa tab (historial incluye resumen ahora)
    if (tabName === 'resumen' || tabName === 'historial') {
        renderResumen();
    }
}

// Manejo de tabs de historial
function showHistorial(tipo) {
    // Ocultar todos los contenidos de historial
    document.querySelectorAll('.historial-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.historial-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar contenido seleccionado
    document.getElementById(`historial-${tipo}`).classList.add('active');
    event.target.classList.add('active');
}

// ==================== GASTOS ====================
async function addGasto(event) {
    event.preventDefault();
    
    // Obtener el botón de submit
    const submitButton = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    const gasto = {
        fecha: document.getElementById('gastoFecha').value,
        descripcion: document.getElementById('gastoDescripcion').value,
        categoria: document.getElementById('gastoCategoria').value,
        cantidad: parseFloat(document.getElementById('gastoCantidad').value),
        moneda: document.getElementById('gastoMoneda').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Guardar en Firebase
        const id = await saveGastoToFirebase(gasto);
        gasto.id = id;
        
        // Agregar SOLO a array local (no recargar de Firebase)
        data.gastos.push(gasto);
        
        // Limpiar formulario
        event.target.reset();
        document.getElementById('gastoFecha').valueAsDate = new Date();
        
        // Actualizar UI (sin recargar desde Firebase)
        renderGastos();
        renderResumen();
        
        // Mostrar notificación de éxito
        showNotification(
            'Gasto registrado',
            `${gasto.descripcion} - ${gasto.moneda} $${formatCurrency(gasto.cantidad)}`,
            'success'
        );
        
        console.log('✅ Gasto agregado');
    } catch (error) {
        console.error('Error al agregar gasto:', error);
        showNotification(
            'Error al guardar',
            'No se pudo guardar el gasto. Intenta nuevamente.',
            'error'
        );
    } finally {
        setButtonLoading(submitButton, false);
    }
    
    // Importante: prevenir doble envío
    return false;
}

function renderGastos() {
    const lista = document.getElementById('gastosLista');
    if (!lista) return;
    
    const filtro = document.getElementById('filtroCategoria')?.value || '';
    const gastosFiltrados = filtro 
        ? data.gastos.filter(g => g.categoria === filtro)
        : data.gastos;
    
    if (gastosFiltrados.length === 0) {
        lista.innerHTML = '<p class="empty-message">No hay gastos registrados</p>';
        return;
    }
    
    lista.innerHTML = gastosFiltrados
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(gasto => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-category">${gasto.categoria}</span>
                    <span class="item-date">${formatDate(gasto.fecha)}</span>
                </div>
                <div class="item-description">${gasto.descripcion}</div>
                <div class="item-footer">
                    <span class="item-amount">${gasto.moneda} $${formatCurrency(gasto.cantidad)}</span>
                    <button onclick="deleteGasto('${gasto.id}')" class="btn-delete">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
}

function filterGastos() {
    renderGastos();
}

async function deleteGasto(id) {
    showConfirm(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.',
        async () => {
            try {
                // Eliminar de Firebase
                await deleteFromFirebase('gastos', id);
                
                // Eliminar del array local
                data.gastos = data.gastos.filter(g => g.id !== id);
                
                // Actualizar UI
                renderGastos();
                renderResumen();
                
                showNotification('Gasto eliminado', 'El gasto se ha eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar gasto:', error);
                showNotification('Error al eliminar', 'No se pudo eliminar el gasto. Intenta nuevamente.', 'error');
            }
        }
    );
}

// ==================== PAGOS ====================
async function addPago(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    const pago = {
        semana: document.getElementById('pagoSemana').value,
        trabajador: document.getElementById('pagoTrabajador').value,
        cantidad: parseFloat(document.getElementById('pagoCantidad').value),
        notas: document.getElementById('pagoNotas').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Guardar en Firebase
        const id = await savePagoToFirebase(pago);
        pago.id = id;
        
        // Agregar a array local
        data.pagos.push(pago);
        
        // Limpiar formulario
        event.target.reset();
        
        // Actualizar UI
        renderPagos();
        renderResumen();
        
        // Mostrar notificación de éxito
        showNotification(
            'Pago registrado',
            `${pago.trabajador} - ARS $${formatCurrency(pago.cantidad)}`,
            'success'
        );
        
        console.log('✅ Pago agregado');
    } catch (error) {
        console.error('Error al agregar pago:', error);
        showNotification(
            'Error al guardar',
            'No se pudo guardar el pago. Intenta nuevamente.',
            'error'
        );
    } finally {
        setButtonLoading(submitButton, false);
    }
    
    return false;
}

function renderPagos() {
    const lista = document.getElementById('pagosLista');
    if (!lista) return;
    
    if (data.pagos.length === 0) {
        lista.innerHTML = '<p class="empty-message">No hay pagos registrados</p>';
        return;
    }
    
    lista.innerHTML = data.pagos
        .sort((a, b) => b.semana.localeCompare(a.semana))
        .map(pago => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-category">👷 ${pago.trabajador}</span>
                    <span class="item-date">Semana ${pago.semana}</span>
                </div>
                ${pago.notas ? `<div class="item-description">${pago.notas}</div>` : ''}
                <div class="item-footer">
                    <span class="item-amount">ARS $${formatCurrency(pago.cantidad)}</span>
                    <button onclick="deletePago('${pago.id}')" class="btn-delete">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
}

async function deletePago(id) {
    showConfirm(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.',
        async () => {
            try {
                // Eliminar de Firebase
                await deleteFromFirebase('pagos', id);
                
                // Eliminar del array local
                data.pagos = data.pagos.filter(p => p.id !== id);
                
                // Actualizar UI
                renderPagos();
                renderResumen();
                
                showNotification('Pago eliminado', 'El pago se ha eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar pago:', error);
                showNotification('Error al eliminar', 'No se pudo eliminar el pago. Intenta nuevamente.', 'error');
            }
        }
    );
}

// ==================== CAMBIOS ====================
async function addCambio(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    const cambio = {
        fecha: document.getElementById('cambioFecha').value,
        dolares: parseFloat(document.getElementById('cambioDolares').value),
        tasa: parseFloat(document.getElementById('cambioTasa').value),
        pesos: parseFloat(document.getElementById('cambioPesos').value),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Guardar en Firebase
        const id = await saveCambioToFirebase(cambio);
        cambio.id = id;
        
        // Agregar a array local
        data.cambios.push(cambio);
        
        // Limpiar formulario
        event.target.reset();
        document.getElementById('cambioFecha').valueAsDate = new Date();
        
        // Actualizar UI
        renderCambios();
        renderResumen();
        
        // Mostrar notificación de éxito
        showNotification(
            'Cambio registrado',
            `USD $${formatCurrency(cambio.dolares)} → ARS $${formatCurrency(cambio.pesos)}`,
            'success'
        );
        
        console.log('✅ Cambio agregado');
    } catch (error) {
        console.error('Error al agregar cambio:', error);
        showNotification(
            'Error al guardar',
            'No se pudo guardar el cambio. Intenta nuevamente.',
            'error'
        );
    } finally {
        setButtonLoading(submitButton, false);
    }
    
    return false;
}

function renderCambios() {
    const lista = document.getElementById('cambiosLista');
    if (!lista) return;
    
    if (data.cambios.length === 0) {
        lista.innerHTML = '<p class="empty-message">No hay cambios registrados</p>';
        return;
    }
    
    lista.innerHTML = data.cambios
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(cambio => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-category">💵 Cambio de Moneda</span>
                    <span class="item-date">${formatDate(cambio.fecha)}</span>
                </div>
                <div class="item-description">
                    USD $${formatCurrency(cambio.dolares)} × ${cambio.tasa.toFixed(2)} = ARS $${formatCurrency(cambio.pesos)}
                </div>
                <div class="item-footer">
                    <span class="item-amount">Tasa: ${cambio.tasa.toFixed(2)}</span>
                    <button onclick="deleteCambio('${cambio.id}')" class="btn-delete">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
}

async function deleteCambio(id) {
    showConfirm(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este cambio de moneda? Esta acción no se puede deshacer.',
        async () => {
            try {
                // Eliminar de Firebase
                await deleteFromFirebase('cambios', id);
                
                // Eliminar del array local
                data.cambios = data.cambios.filter(c => c.id !== id);
                
                // Actualizar UI
                renderCambios();
                renderResumen();
                
                showNotification('Cambio eliminado', 'El cambio de moneda se ha eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar cambio:', error);
                showNotification('Error al eliminar', 'No se pudo eliminar el cambio. Intenta nuevamente.', 'error');
            }
        }
    );
}

// ==================== AVANCES ====================
async function addAvance(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    const avance = {
        fecha: document.getElementById('avanceFecha').value,
        descripcion: document.getElementById('avanceDescripcion').value,
        porcentaje: parseFloat(document.getElementById('avancePorcentaje').value),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Guardar en Firebase
        const id = await saveAvanceToFirebase(avance);
        avance.id = id;
        
        // Agregar a array local
        data.avances.push(avance);
        
        // Limpiar formulario
        event.target.reset();
        
        // Actualizar UI
        renderAvances();
        
        // Mostrar notificación de éxito
        showNotification(
            'Avance registrado',
            `${avance.descripcion} - ${avance.porcentaje}% completado`,
            'success'
        );
        
        console.log('✅ Avance agregado');
    } catch (error) {
        console.error('Error al agregar avance:', error);
        showNotification(
            'Error al guardar',
            'No se pudo guardar el avance. Intenta nuevamente.',
            'error'
        );
    } finally {
        setButtonLoading(submitButton, false);
    }
    
    return false;
}

function renderAvances() {
    const lista = document.getElementById('avancesLista');
    if (!lista) return;
    
    if (data.avances.length === 0) {
        lista.innerHTML = '<p class="empty-message">No hay avances registrados</p>';
        return;
    }
    
    lista.innerHTML = data.avances
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(avance => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-date">${formatDate(avance.fecha)}</span>
                    <span class="item-percentage">${avance.porcentaje}%</span>
                </div>
                <div class="item-description">${avance.descripcion}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${avance.porcentaje}%"></div>
                </div>
                <button onclick="deleteAvance('${avance.id}')" class="btn-delete">🗑️ Eliminar</button>
            </div>
        `).join('');
}

async function deleteAvance(id) {
    showConfirm(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este avance? Esta acción no se puede deshacer.',
        async () => {
            try {
                // Eliminar de Firebase
                await deleteFromFirebase('avances', id);
                
                // Eliminar del array local
                data.avances = data.avances.filter(a => a.id !== id);
                
                // Actualizar UI
                renderAvances();
                
                showNotification('Avance eliminado', 'El avance se ha eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar avance:', error);
                showNotification('Error al eliminar', 'No se pudo eliminar el avance. Intenta nuevamente.', 'error');
            }
        }
    );
}

// ==================== RESUMEN ====================
function renderResumen() {
    const general = document.getElementById('resumenGeneral');
    const categorias = document.getElementById('resumenCategorias');
    
    if (!general) return;
    
    // Calcular totales
    const totalGastosARS = data.gastos
        .filter(g => g.moneda === 'ARS')
        .reduce((sum, g) => sum + g.cantidad, 0);
    
    const totalGastosUSD = data.gastos
        .filter(g => g.moneda === 'USD')
        .reduce((sum, g) => sum + g.cantidad, 0);
    
    const totalPagos = data.pagos.reduce((sum, p) => sum + p.cantidad, 0);
    
    const totalDolaresComprados = data.cambios.reduce((sum, c) => sum + c.dolares, 0);
    const totalCambios = data.cambios.reduce((sum, c) => sum + c.pesos, 0);
    
    // Calcular promedio de tasa de cambio
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    const totalGeneral = totalGastosARS + totalPagos;
    
    // Renderizar resumen general
    general.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">
                    <span><strong>💵 Total Gastos en Pesos: </strong></span>
                    <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalGastosARS)} ARS</span>
                </div>
                <div class="summary-value">
                    <span><strong>💵 Total Gastos en Dólares:</strong></span>
                    <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalGastosUSD)} USD</span>
                </div>
                <div class="summary-value">
                    <span><strong>👷 Total Pagos a Trabajadores:</strong></span>
                    <span style="font-size:  1.3em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalPagos)} ARS</span>
                </div>
                <div class="summary-value">
                    <span><strong>💱 Dólares Cambiados:</strong></span>
                    <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalDolaresComprados)} USD → $${formatCurrency(totalCambios)} ARS</span>
                </div>
            </div>
            <div class="summary-card highlight">
                <div class="summary-value">
                    <span><strong>📊 Total General (ARS)</strong></span>
                    <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalGeneral)}</span>
                </div>
            </div>
        </div>
    `;
    
    // Renderizar gastos por categoría
    if (categorias) {
        const porCategoria = {};
        data.gastos.forEach(gasto => {
            if (!porCategoria[gasto.categoria]) {
                porCategoria[gasto.categoria] = 0;
            }
            const monto = gasto.moneda === 'USD' ? gasto.cantidad * tasaPromedio : gasto.cantidad;
            porCategoria[gasto.categoria] += monto;
        });
        
        const categoriasHTML = Object.entries(porCategoria)
            .sort((a, b) => b[1] - a[1])
            .map(([categoria, total]) => {
                const porcentaje = (total / totalGeneral * 100).toFixed(1);
                return `
                    <div class="categoria-item">
                        <div class="categoria-header">
                            <span class="categoria-nombre"><strong>${categoria}</strong></span>
                            <span class="categoria-monto" style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${formatCurrency(total)} (${porcentaje}%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        
        categorias.innerHTML = categoriasHTML || '<p class="empty-message">No hay gastos por categoría</p>';
    }
}

// ==================== IMPORT/EXPORT ====================
function exportData() {
    const exportData = {
        gastos: data.gastos,
        pagos: data.pagos,
        cambios: data.cambios,
        avances: data.avances,
        exportDate: new Date().toISOString(),
        source: 'firebase'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obra-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!confirm('¿Deseas importar estos datos? Se agregarán a los datos existentes.')) {
                return;
            }
            
            // Importar a Firebase
            for (const gasto of importedData.gastos || []) {
                await saveGastoToFirebase(gasto);
            }
            
            for (const pago of importedData.pagos || []) {
                await savePagoToFirebase(pago);
            }
            
            for (const cambio of importedData.cambios || []) {
                await saveCambioToFirebase(cambio);
            }
            
            for (const avance of importedData.avances || []) {
                await saveAvanceToFirebase(avance);
            }
            
            // Recargar datos
            await loadDataFromFirebase();
            
            alert('Datos importados exitosamente!');
            
        } catch (error) {
            console.error('Error al importar:', error);
            alert('Error al importar el archivo');
        }
    };
    reader.readAsText(file);
}

// Cargar datos desde localStorage (respaldo)
function loadData() {
    data.gastos = JSON.parse(localStorage.getItem('gastos')) || [];
    data.pagos = JSON.parse(localStorage.getItem('pagos')) || [];
    data.cambios = JSON.parse(localStorage.getItem('cambios')) || [];
    data.avances = JSON.parse(localStorage.getItem('avances')) || [];
    
    renderGastos();
    renderPagos();
    renderCambios();
    renderAvances();
    renderResumen();
    
    // Ocultar loading al cargar desde localStorage
    if (typeof hideLoading === 'function') {
        hideLoading();
    }
}

// ==================== UTILIDADES ====================
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// ==================== PRESUPUESTO ====================
// Modal de nuevo presupuesto
function showNewBudgetModal() {
    document.getElementById('newBudgetModal').style.display = 'flex';
}

function closeNewBudgetModal() {
    document.getElementById('newBudgetModal').style.display = 'none';
    document.getElementById('newBudgetName').value = '';
    document.getElementById('newBudgetCategory').value = '';
    document.getElementById('newBudgetDescription').value = '';
}

async function createNewBudget(event) {
    event.preventDefault();
    
    const budget = {
        nombre: document.getElementById('newBudgetName').value,
        categoria: document.getElementById('newBudgetCategory').value,
        descripcion: document.getElementById('newBudgetDescription').value || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Guardar en Firebase
        const id = await saveBudgetToFirebase(budget);
        budget.id = id;
        
        // Agregar al array local
        data.presupuestos.push(budget);
        
        // Renderizar selector de presupuestos
        renderBudgetSelector();
        
        // Seleccionar automáticamente el nuevo presupuesto
        selectBudget(budget.id);
        
        // Cerrar modal
        closeNewBudgetModal();
        
        showNotification(
            'Presupuesto creado',
            `${budget.nombre} ha sido creado exitosamente`,
            'success'
        );
    } catch (error) {
        console.error('Error al crear presupuesto:', error);
        showNotification(
            'Error al crear',
            'No se pudo crear el presupuesto. Intenta nuevamente.',
            'error'
        );
    }
    
    return false;
}

function renderBudgetSelector() {
    const selector = document.getElementById('budgetSelector');
    
    if (data.presupuestos.length === 0) {
        selector.innerHTML = `
            <div class="budget-empty-state">
                <p>📋 No tienes presupuestos creados</p>
                <p style="font-size: 0.9em; color: #6c757d;">Crea tu primer presupuesto para comenzar</p>
            </div>
        `;
        document.getElementById('activeBudgetContainer').style.display = 'none';
        return;
    }
    
    const categoryIcons = {
        'baño': '🚿',
        'cocina': '🍳',
        'dormitorio': '🛏️',
        'living': '🛋️',
        'exterior': '🏡',
        'estructura': '🏗️',
        'instalaciones': '🔧',
        'terminaciones': '🎨',
        'otros': '📦'
    };
    
    selector.innerHTML = data.presupuestos.map(budget => `
        <button class="budget-area-tab ${currentBudget && currentBudget.id === budget.id ? 'active' : ''}" 
                onclick="selectBudget('${budget.id}')">
            <div class="budget-tab-name">
                ${categoryIcons[budget.categoria] || '📋'} ${budget.nombre}
            </div>
            ${budget.descripcion ? `<div class="budget-tab-category">${budget.descripcion.substring(0, 30)}...</div>` : ''}
        </button>
    `).join('');
}

function selectBudget(budgetId) {
    // Encontrar el presupuesto
    currentBudget = data.presupuestos.find(b => b.id === budgetId);
    
    if (!currentBudget) return;
    
    // Mostrar contenedor activo
    document.getElementById('activeBudgetContainer').style.display = 'block';
    document.getElementById('deleteBudgetBtn').style.display = 'inline-flex';
    
    // Actualizar nombre del presupuesto
    document.getElementById('currentBudgetName').textContent = currentBudget.nombre;
    
    // Actualizar tabs activos
    renderBudgetSelector();
    
    // Renderizar items y resumen
    renderBudgetItems();
    renderBudgetSummary();
}

async function deleteCurrentBudget() {
    if (!currentBudget) return;
    
    showConfirm(
        'Confirmar eliminación',
        `¿Estás seguro de eliminar el presupuesto "${currentBudget.nombre}" y todos sus items?`,
        async () => {
            try {
                
                // Eliminar todos los items asociados
                const itemsToDelete = data.presupuestoItems.filter(item => item.presupuestoId === currentBudget.id);
                for (const item of itemsToDelete) {
                    await deleteFromFirebase('presupuestoItems', item.id);
                }
                
                // Eliminar presupuesto de Firebase
                await deleteFromFirebase('presupuestos', currentBudget.id);

                // Eliminar del array local
                data.presupuestos = data.presupuestos.filter(b => b.id !== currentBudget.id);
                data.presupuestoItems = data.presupuestoItems.filter(item => item.presupuestoId !== currentBudget.id);
                
                // Resetear presupuesto actual
                currentBudget = null;
                
                // Renderizar
                renderBudgetSelector();
                
                showNotification('Presupuesto eliminado', 'El presupuesto ha sido eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar presupuesto:', error);
                showNotification('Error', 'No se pudo eliminar el presupuesto', 'error');
            }
        }
    );
}

async function addBudgetItem(event) {
    event.preventDefault();
    
    if (!currentBudget) {
        showNotification('Error', 'Debes seleccionar un presupuesto primero', 'error');
        return false;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    // Obtener imagen si existe
    const imageFile = document.getElementById('budgetItemImage').files[0];
    let imageUrl = null;
    
    if (imageFile) {
        imageUrl = await convertImageToBase64(imageFile);
    }
    
    const item = {
        presupuestoId: currentBudget.id,
        nombre: document.getElementById('budgetItemName').value,
        descripcion: document.getElementById('budgetItemDescription').value,
        valorEstimado: parseFloat(document.getElementById('budgetItemEstimated').value),
        valorReal: null,
        comprado: false,
        imagen: imageUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Guardar en Firebase
        const id = await savePresupuestoItemToFirebase(item);
        item.id = id;
        
        // Agregar al array local
        data.presupuestoItems.push(item);
        
        // Limpiar formulario
        event.target.reset();
        if (document.getElementById('imagePreview')) {
            document.getElementById('imagePreview').classList.add('hidden');
            document.getElementById('imagePreview').innerHTML = '';
        }
        
        // Actualizar UI
        renderBudgetItems();
        renderBudgetSummary();
        
        showNotification(
            'Item agregado',
            `${item.nombre} agregado al presupuesto`,
            'success'
        );
    } catch (error) {
        console.error('Error al agregar item:', error);
        showNotification(
            'Error al guardar',
            'No se pudo agregar el item. Intenta nuevamente.',
            'error'
        );
    } finally {
        setButtonLoading(submitButton, false);
    }
    
    return false;
}

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Preview de imagen antes de subir
document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('budgetItemImage');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('imagePreview');
                    preview.innerHTML = `
                        <img src="${event.target.result}" alt="Preview">
                        <button class="image-preview-remove" onclick="removeImagePreview()" type="button">×</button>
                    `;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function removeImagePreview() {
    document.getElementById('budgetItemImage').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('imagePreview').innerHTML = '';
}

function renderBudgetItems() {
    const lista = document.getElementById('budgetItemsList');
    
    if (!currentBudget) {
        lista.innerHTML = `
            <div class="budget-empty">
                <div class="budget-empty-icon">📋</div>
                <h3>Selecciona un presupuesto</h3>
                <p>Elige un presupuesto para ver y agregar items</p>
            </div>
        `;
        return;
    }
    
    const items = data.presupuestoItems.filter(item => item.presupuestoId === currentBudget.id);
    
    if (items.length === 0) {
        lista.innerHTML = `
            <div class="budget-empty">
                <div class="budget-empty-icon">📋</div>
                <h3>No hay items en este presupuesto</h3>
                <p>Comienza agregando items usando el formulario</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = items.map(item => {
        const diferencia = item.valorReal ? item.valorReal - item.valorEstimado : 0;
        const diferenciaClass = diferencia > 0 ? 'negative' : diferencia < 0 ? 'positive' : '';
        const diferenciaText = diferencia > 0 ? `+$${formatCurrency(Math.abs(diferencia))}` : 
                               diferencia < 0 ? `-$${formatCurrency(Math.abs(diferencia))}` : `$${formatCurrency(0)}`;
        
        return `
            <div class="budget-item ${item.comprado ? 'comprado' : ''}">
                <div class="budget-item-header">
                    <div class="budget-item-title">
                        <h4>${item.nombre}</h4>
                        ${item.descripcion ? `<p class="budget-item-description">${item.descripcion}</p>` : ''}
                    </div>
                    ${item.imagen ? `<img src="${item.imagen}" class="budget-item-image" onclick="openImageModal('${item.imagen}')" alt="${item.nombre}">` : ''}
                </div>
                <div class="budget-item-body">
                    <div class="budget-item-price">
                        <span class="price-label">💵 Valor Estimado</span>
                        <span class="price-value">$${formatCurrency(item.valorEstimado)}</span>
                    </div>
                    ${item.comprado ? `
                        <div class="budget-item-price">
                            <span class="price-label">💰 Valor Real</span>
                            <span class="price-value real">$${formatCurrency(item.valorReal || 0)}</span>
                        </div>
                        <div class="budget-item-price">
                            <span class="price-label">📊 Diferencia</span>
                            <span class="price-difference ${diferenciaClass}">${diferenciaText}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="budget-item-footer">
                    <div class="real-price-section">
                        <div class="budget-item-checkbox">
                            <input type="checkbox" id="check-${item.id}" 
                                ${item.comprado ? 'checked' : ''} 
                                onchange="toggleBudgetItemComprado('${item.id}')"
                                ${item.valorReal ? 'disabled' : ''}>
                            <label for="check-${item.id}">Comprado</label>
                        </div>
                        ${item.comprado ? `
                            <input type="number" 
                                id="realPrice-${item.id}"
                                class="real-price-input" 
                                placeholder="Ingrese valor real"
                                value="${item.valorReal || ''}"
                                step="0.01"
                                ${item.valorReal ? 'disabled' : ''}>
                            ${item.comprado && !item.valorReal ? `
                                <button class="btn-save-price" 
                                        id="saveBtn-${item.id}"
                                        onclick="saveRealPrice('${item.id}')"
                                        ${item.valorReal ? 'disabled' : ''}>
                                    💾 ${item.valorReal ? 'Guardado' : 'Guardar'}
                                </button>
                            ` : ''}
                            
                        ` : ''}
                    </div>
                    <div class="budget-item-actions">
                        <button class="btn-delete-budget" onclick="deleteBudgetItem('${item.id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}async function toggleBudgetItemComprado(id) {
    const itemIndex = data.presupuestoItems.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        const wasComprado = data.presupuestoItems[itemIndex].comprado;
        data.presupuestoItems[itemIndex].comprado = !wasComprado;
        
        // Si se desmarca como comprado, limpiar valor real y guardar
        if (!data.presupuestoItems[itemIndex].comprado) {
            data.presupuestoItems[itemIndex].valorReal = null;
            
            try {
                // Actualizar en Firebase solo cuando se desmarca
                await updatePresupuestoItemInFirebase(data.presupuestoItems[itemIndex]);
                
                showNotification(
                    'Item desmarcado',
                    'El item ya no está marcado como comprado',
                    'info'
                );
            } catch (error) {
                console.error('Error al actualizar item:', error);
                showNotification('Error', 'No se pudo actualizar el item', 'error');
                // Revertir cambio en caso de error
                data.presupuestoItems[itemIndex].comprado = wasComprado;
            }
        } else {
            // Solo mostrar mensaje informativo cuando se marca como comprado
            showNotification(
                'Item marcado como comprado',
                'Ingresa el valor real y presiona "Guardar"',
                'info'
            );
        }
        
        // Actualizar UI
        renderBudgetItems();
        renderBudgetSummary();
    }
}

// Nueva función para guardar el valor real
async function saveRealPrice(id) {
    const itemIndex = data.presupuestoItems.findIndex(item => item.id === id);
    const inputElement = document.getElementById(`realPrice-${id}`);
    
    if (itemIndex === -1 || !inputElement) return;
    
    const value = parseFloat(inputElement.value);
    
    if (!value || value <= 0) {
        showNotification('Valor inválido', 'Ingresa un valor mayor a 0', 'error');
        return;
    }
    
    // Guardar el valor anterior por si hay error
    const previousValue = data.presupuestoItems[itemIndex].valorReal;
    data.presupuestoItems[itemIndex].valorReal = value;
    
    try {
        // Actualizar en Firebase
        await updatePresupuestoItemInFirebase(data.presupuestoItems[itemIndex]);
        
        // Actualizar UI
        renderBudgetItems();
        renderBudgetSummary();
        
        showNotification('Precio guardado', 'El valor real se ha guardado correctamente', 'success');
    } catch (error) {
        console.error('Error al actualizar precio:', error);
        // Revertir cambio en caso de error
        data.presupuestoItems[itemIndex].valorReal = previousValue;
        showNotification('Error', 'No se pudo guardar el precio. Intenta nuevamente.', 'error');
    }
}

async function updateRealPrice(id, value) {
    const itemIndex = data.presupuestoItems.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        data.presupuestoItems[itemIndex].valorReal = parseFloat(value) || 0;
        
        try {
            // Actualizar en Firebase
            await updatePresupuestoItemInFirebase(data.presupuestoItems[itemIndex]);
            
            // Actualizar UI
            renderBudgetItems();
            renderBudgetSummary();
            
            showNotification('Precio actualizado', 'Valor real guardado correctamente', 'success');
        } catch (error) {
            console.error('Error al actualizar precio:', error);
            showNotification('Error', 'No se pudo actualizar el precio', 'error');
        }
    }
}
async function deleteBudgetItem(id) {
    showConfirm(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este item del presupuesto?',
        async () => {
            try {
                // Eliminar de Firebase
                await deleteFromFirebase('presupuestoItems', id);
                
                // Eliminar del array local
                data.presupuestoItems = data.presupuestoItems.filter(item => item.id !== id);
                
                // Actualizar UI
                renderBudgetItems();
                renderBudgetSummary();
                
                showNotification('Item eliminado', 'El item se ha eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar item:', error);
                showNotification('Error al eliminar', 'No se pudo eliminar el item', 'error');
            }
        }
    );
}

function renderBudgetSummary() {
    if (!currentBudget) return;
    
    const items = data.presupuestoItems.filter(item => item.presupuestoId === currentBudget.id);
    
    const totalItems = items.length;
    const compradosItems = items.filter(item => item.comprado).length;
    const estimadoTotal = items.reduce((sum, item) => sum + item.valorEstimado, 0);
    const realTotal = items.reduce((sum, item) => sum + (item.valorReal || 0), 0);
    const diferencia = realTotal - estimadoTotal;
    
    document.getElementById('budgetTotalItems').textContent = totalItems;
    document.getElementById('budgetCompradosItems').textContent = compradosItems;
    document.getElementById('budgetEstimadoTotal').textContent = `$${formatCurrency(estimadoTotal)}`;
    document.getElementById('budgetRealTotal').textContent = `$${formatCurrency(realTotal)}`;
    
    const diferenciaCard = document.getElementById('budgetDiferencia');
    const diferenciaValue = document.getElementById('budgetDiferenciaTotal');
    
    // Actualizar clase según la diferencia
    diferenciaCard.classList.remove('positive', 'negative');
    if (diferencia < 0) {
        diferenciaCard.classList.add('positive');
        diferenciaValue.textContent = `-$${formatCurrency(Math.abs(diferencia))}`;
    } else if (diferencia > 0) {
        diferenciaCard.classList.add('negative');
        diferenciaValue.textContent = `+$${formatCurrency(diferencia)}`;
    } else {
        diferenciaValue.textContent = `$${formatCurrency(0)}`;
    }
}

function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal-overlay';
    modal.innerHTML = `
        <div class="image-modal">
            <button class="image-modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <img src="${imageUrl}" alt="Imagen ampliada">
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


// Versión de app.js integrada con Firebase
// Este archivo reemplaza las funciones que usan localStorage por Firebase

// Inicializar datos
let data = {
    gastos: [],
    pagos: [],
    cambios: [],
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

// Variables para modo edición de items de presupuesto
let budgetItemEditMode = {
    active: false,
    id: null,
    item: null
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
    
    // Actualizar contenido según el tab
    if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'resumen' || tabName === 'historial') {
        renderResumen();
        renderItemsComprados();
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
    
    // Renderizar items comprados cuando se selecciona esa pestaña
    if (tipo === 'items-comprados') {
        renderItemsComprados();
    }
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

// ==================== ITEMS COMPRADOS DEL PRESUPUESTO ====================
function renderItemsComprados() {
    const lista = document.getElementById('itemsCompradosLista');
    if (!lista) {
        console.log('❌ No se encontró el elemento itemsCompradosLista');
        return;
    }
    
    console.log('🔍 Renderizando items comprados...');
    console.log('Total presupuestos:', data.presupuestos.length);
    console.log('Total items presupuesto:', data.presupuestoItems.length);
    
    // Llenar el filtro de presupuestos
    const filtroPresupuesto = document.getElementById('filtroPresupuesto');
    if (filtroPresupuesto) {
        const presupuestosUnicos = [...new Set(data.presupuestos.map(p => p.id))];
        filtroPresupuesto.innerHTML = '<option value="">Todos los presupuestos</option>' +
            data.presupuestos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    }
    
    const filtro = filtroPresupuesto?.value || '';
    const itemsComprados = data.presupuestoItems.filter(item => item.comprado && item.valorReal);
    
    console.log('Items comprados (con valor real):', itemsComprados.length);
    
    let itemsFiltrados = itemsComprados;
    if (filtro) {
        itemsFiltrados = itemsComprados.filter(item => item.presupuestoId === filtro);
    }
    
    if (itemsFiltrados.length === 0) {
        lista.innerHTML = '<p class="empty-message">No hay items comprados registrados</p>';
        return;
    }
    
    // Ordenar por timestamp (más reciente primero)
    itemsFiltrados.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
    });
    
    lista.innerHTML = itemsFiltrados.map(item => {
        const presupuesto = data.presupuestos.find(p => p.id === item.presupuestoId);
        const diferencia = item.valorReal - item.valorEstimado;
        const diferenciaClass = diferencia > 0 ? 'negative' : diferencia < 0 ? 'positive' : 'neutral';
        const diferenciaText = diferencia > 0 ? `+$${formatCurrency(Math.abs(diferencia))}` : 
                               diferencia < 0 ? `-$${formatCurrency(Math.abs(diferencia))}` : `$${formatCurrency(0)}`;
        
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
        
        const presupuestoNombre = presupuesto ? `${categoryIcons[presupuesto.categoria] || '📋'} ${presupuesto.nombre}` : 'Presupuesto desconocido';
        
        return `
            <div class="item-card item-comprado-card">
                <div class="item-header">
                    <span class="item-category">${presupuestoNombre}</span>
                    ${item.conTarjeta ? `<span class="badge badge-tdc">💳 ${item.cuotas} cuota${item.cuotas > 1 ? 's' : ''}</span>` : ''}
                </div>
                <div class="item-comprado-title">
                    <h4>${item.nombre}</h4>
                    ${item.descripcion ? `<p class="item-comprado-desc">${item.descripcion}</p>` : ''}
                </div>
                ${item.imagen ? `
                    <div class="item-comprado-image-container">
                        <img src="${item.imagen}" class="item-comprado-image-thumb" onclick="openImageModal('${item.imagen}')" alt="${item.nombre}">
                    </div>
                ` : ''}
                <div class="item-comprado-prices">
                    <div class="price-box">
                        <span class="price-label">💵 Estimado</span>
                        <span class="price-value">$${formatCurrency(item.valorEstimado)}</span>
                    </div>
                    <div class="price-box">
                        <span class="price-label">💰 Real</span>
                        <span class="price-value real">$${formatCurrency(item.valorReal)}</span>
                    </div>
                    <div class="price-box">
                        <span class="price-label">📊 Diferencia</span>
                        <span class="price-difference ${diferenciaClass}">${diferenciaText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterItemsComprados() {
    renderItemsComprados();
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
    const totalObra = 24300000;
    const faltantePagos = totalObra - totalPagos;
    
    const totalDolaresComprados = data.cambios.reduce((sum, c) => sum + c.dolares, 0);
    const totalCambios = data.cambios.reduce((sum, c) => sum + c.pesos, 0);
    
    // Calcular promedio de tasa de cambio
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    // Calcular totales de presupuestos
    const totalPresupuestosEstimado = data.presupuestoItems
        .reduce((sum, item) => sum + (item.valorEstimado || 0), 0);
    
    const totalPresupuestosComprado = data.presupuestoItems
        .filter(item => item.comprado && item.valorReal)
        .reduce((sum, item) => sum + (item.valorReal || 0), 0);
    
    const presupuestosItemsComprados = data.presupuestoItems
        .filter(item => item.comprado && item.valorReal).length;
    
    // Calcular total con TDC
    const totalConTDC = data.presupuestoItems
        .filter(item => item.comprado && item.valorReal && item.conTarjeta)
        .reduce((sum, item) => sum + (item.valorReal || 0), 0);
    
    const totalGeneral = totalGastosARS + totalPagos + totalPresupuestosComprado;
    
    // Renderizar resumen general
    general.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">
                    <span style="font-size: 0.95em;"><strong>💵 Total Gastos en Pesos:</strong></span>
                    <span style="font-size: 0.95em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalGastosARS)} ARS</span>
                </div>
                <div class="summary-value" style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 0.95em;"><strong>👷 Pagos:</strong> <span style="color:#1e3c72; font-weight: bold;">$${formatCurrency(totalPagos)}</span></span>
                    <span style="font-size: 0.95em;"><strong>Total Obra:</strong> <span style="color:#1e3c72; font-weight: bold;">$${formatCurrency(totalObra)}</span></span>
                    <span style="font-size: 0.95em;"><strong>Faltante:</strong> <span style="color:${faltantePagos > 0 ? '#dc3545' : '#28a745'}; font-weight: bold;">$${formatCurrency(faltantePagos)}</span></span>
                </div>
                <div class="summary-value">
                    <span style="font-size: 0.95em;"><strong>💱 Dólares Cambiados:</strong></span>
                    <span style="font-size: 0.95em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalDolaresComprados)} USD → $${formatCurrency(totalCambios)} ARS</span>
                </div>
                <div class="summary-value">
                    <span style="font-size: 0.95em;"><strong>📋 Presupuestos Estimado Total:</strong></span>
                    <span style="font-size: 0.95em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalPresupuestosEstimado)} ARS</span>
                </div>
                <div class="summary-value">
                    <span style="font-size: 0.95em;"><strong>💰 Presupuestos Comprado (${presupuestosItemsComprados} items):</strong></span>
                    <span style="font-size: 0.95em; color:#28a745; font-weight: bold;">$${formatCurrency(totalPresupuestosComprado)} ARS</span>
                </div>
                <div class="summary-value">
                    <span style="font-size: 0.95em;"><strong>💳 Compras con TDC:</strong></span>
                    <span style="font-size: 0.95em; color:#dc3545; font-weight: bold;">$${formatCurrency(totalConTDC)} ARS</span>
                </div>
            </div>
            <div class="summary-card highlight">
                <div class="summary-value">
                    <span style="font-size: 0.95em;"><strong>📊 Total General (ARS)</strong></span>
                    <span style="font-size: 0.95em; color:#1e3c72; font-weight: bold;">$${formatCurrency(totalGeneral)}</span>
                </div>
                <div class="summary-value" style="font-size: 0.85em; color: #6c757d; margin-top: 8px;">
                    <span>Incluye: Gastos + Pagos + Items Presupuesto Comprados</span>
                </div>
            </div>
        </div>
    `;
    
    // Renderizar gastos por categoría
    if (categorias) {
        console.log('📊 Renderizando gastos por categoría...');
        const porCategoria = {};
        const detallesCategoria = {}; // Para guardar detalles de cada categoría
        
        // Agregar gastos regulares
        data.gastos.forEach(gasto => {
            if (!porCategoria[gasto.categoria]) {
                porCategoria[gasto.categoria] = 0;
                detallesCategoria[gasto.categoria] = { gastos: 0, presupuestos: 0 };
            }
            const monto = gasto.moneda === 'USD' ? gasto.cantidad * tasaPromedio : gasto.cantidad;
            porCategoria[gasto.categoria] += monto;
            detallesCategoria[gasto.categoria].gastos += monto;
        });
        
        // Agregar items comprados de presupuestos (agrupados por categoría del presupuesto)
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
        
        // Mapeo de categorías de presupuesto a nombres amigables
        const categoryNames = {
            'baño': 'Baño',
            'cocina': 'Cocina',
            'dormitorio': 'Dormitorio',
            'living': 'Living/Comedor',
            'exterior': 'Exterior',
            'estructura': 'Estructura',
            'instalaciones': 'Instalaciones',
            'terminaciones': 'Terminaciones',
            'otros': 'Otros'
        };
        
        const itemsCompradosParaCategorias = data.presupuestoItems.filter(item => item.comprado && item.valorReal);
        console.log('Items comprados para agregar a categorías:', itemsCompradosParaCategorias.length);
        
        data.presupuestoItems
            .filter(item => item.comprado && item.valorReal)
            .forEach(item => {
                const presupuesto = data.presupuestos.find(p => p.id === item.presupuestoId);
                console.log('Procesando item:', item.nombre, 'Presupuesto encontrado:', presupuesto?.nombre, 'Categoría:', presupuesto?.categoria);
                if (presupuesto && presupuesto.categoria) {
                    const categoriaPresupuesto = categoryNames[presupuesto.categoria] || presupuesto.categoria;
                    
                    if (!porCategoria[categoriaPresupuesto]) {
                        porCategoria[categoriaPresupuesto] = 0;
                        detallesCategoria[categoriaPresupuesto] = { gastos: 0, presupuestos: 0 };
                    }
                    porCategoria[categoriaPresupuesto] += item.valorReal;
                    detallesCategoria[categoriaPresupuesto].presupuestos += item.valorReal;
                    console.log('✅ Agregado a categoría:', categoriaPresupuesto, 'Monto:', item.valorReal);
                }
            });
        
        const categoriasHTML = Object.entries(porCategoria)
            .sort((a, b) => b[1] - a[1])
            .map(([categoria, total]) => {
                const porcentaje = (total / totalGeneral * 100).toFixed(1);
                const detalles = detallesCategoria[categoria] || { gastos: 0, presupuestos: 0 };
                
                // Mostrar desglose si hay gastos de ambos tipos
                const tieneAmbos = detalles.gastos > 0 && detalles.presupuestos > 0;
                
                return `
                    <div class="categoria-item">
                        <div class="categoria-header">
                            <span class="categoria-nombre"><strong>${categoria}</strong></span>
                            <span class="categoria-monto" style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${formatCurrency(total)} (${porcentaje}%)</span>
                        </div>
                        ${tieneAmbos ? `
                            <div class="categoria-detalles">
                                <span style="font-size: 0.85em; color: #6c757d;">
                                    💰 Gastos: $${formatCurrency(detalles.gastos)} | 
                                    📋 Presupuestos: $${formatCurrency(detalles.presupuestos)}
                                </span>
                            </div>
                        ` : ''}
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        
        console.log('📊 Categorías finales:', Object.keys(porCategoria));
        console.log('Detalles por categoría:', detallesCategoria);
        categorias.innerHTML = categoriasHTML || '<p class="empty-message">No hay gastos por categoría</p>';
    }
}

// ==================== IMPORT/EXPORT ====================
function exportData() {
    const exportData = {
        gastos: data.gastos,
        pagos: data.pagos,
        cambios: data.cambios,
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
    
    renderGastos();
    renderPagos();
    renderCambios();
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
    } else if (budgetItemEditMode.active && budgetItemEditMode.item && budgetItemEditMode.item.imagen) {
        // Mantener la imagen existente si estamos editando y no se seleccionó una nueva
        imageUrl = budgetItemEditMode.item.imagen;
    }
    
    const item = {
        presupuestoId: currentBudget.id,
        nombre: document.getElementById('budgetItemName').value,
        descripcion: document.getElementById('budgetItemDescription').value,
        valorEstimado: parseFloat(document.getElementById('budgetItemEstimated').value),
        valorReal: budgetItemEditMode.active ? budgetItemEditMode.item.valorReal : null,
        comprado: budgetItemEditMode.active ? budgetItemEditMode.item.comprado : false,
        conTarjeta: budgetItemEditMode.active ? budgetItemEditMode.item.conTarjeta : false,
        cuotas: budgetItemEditMode.active ? budgetItemEditMode.item.cuotas : null,
        imagen: imageUrl,
        timestamp: budgetItemEditMode.active ? budgetItemEditMode.item.timestamp : firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (budgetItemEditMode.active) {
            // Modo edición: actualizar item existente
            item.id = budgetItemEditMode.id;
            
            // Actualizar en Firebase
            await updatePresupuestoItemInFirebase(item);
            
            // Actualizar en el array local
            const itemIndex = data.presupuestoItems.findIndex(i => i.id === budgetItemEditMode.id);
            if (itemIndex !== -1) {
                data.presupuestoItems[itemIndex] = item;
            }
            
            showNotification(
                'Item actualizado',
                `${item.nombre} ha sido actualizado correctamente`,
                'success'
            );
            
            // Cancelar modo edición
            cancelBudgetItemEdit();
        } else {
            // Modo creación: nuevo item
            const id = await savePresupuestoItemToFirebase(item);
            item.id = id;
            
            // Agregar al array local
            data.presupuestoItems.push(item);
            
            showNotification(
                'Item agregado',
                `${item.nombre} agregado al presupuesto`,
                'success'
            );
        }
        
        // Limpiar formulario
        event.target.reset();
        if (document.getElementById('imagePreview')) {
            document.getElementById('imagePreview').classList.add('hidden');
            document.getElementById('imagePreview').innerHTML = '';
        }
        
        // Actualizar UI
        renderBudgetItems();
        renderBudgetSummary();
        
    } catch (error) {
        console.error('Error al guardar item:', error);
        showNotification(
            'Error al guardar',
            'No se pudo guardar el item. Intenta nuevamente.',
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

// Función para editar un item de presupuesto
function editBudgetItem(id) {
    const item = data.presupuestoItems.find(i => i.id === id);
    if (!item) return;
    
    // Activar modo edición
    budgetItemEditMode.active = true;
    budgetItemEditMode.id = id;
    budgetItemEditMode.item = item;
    
    // Cargar datos en el formulario
    document.getElementById('budgetItemName').value = item.nombre;
    document.getElementById('budgetItemDescription').value = item.descripcion || '';
    document.getElementById('budgetItemEstimated').value = item.valorEstimado;
    
    // Mostrar preview de imagen si existe
    if (item.imagen) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `
            <img src="${item.imagen}" alt="Preview">
            <button class="image-preview-remove" onclick="removeImagePreview()" type="button">×</button>
        `;
        preview.classList.remove('hidden');
    }
    
    // Cambiar el texto del botón submit
    const submitButton = document.querySelector('#activeBudgetContainer form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = '✏️ Actualizar Item';
        submitButton.classList.add('btn-edit-mode');
    }
    
    // Agregar botón de cancelar si no existe
    let cancelButton = document.getElementById('cancelEditBudgetItemBtn');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.id = 'cancelEditBudgetItemBtn';
        cancelButton.type = 'button';
        cancelButton.className = 'btn-cancel';
        cancelButton.textContent = '✖️ Cancelar Edición';
        cancelButton.onclick = cancelBudgetItemEdit;
        submitButton.parentNode.insertBefore(cancelButton, submitButton);
    }
    
    // Scroll al formulario
    document.querySelector('#activeBudgetContainer form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    showNotification(
        'Modo edición',
        `Editando: ${item.nombre}`,
        'info'
    );
}

// Función para cancelar modo edición de item
function cancelBudgetItemEdit() {
    // Desactivar modo edición
    budgetItemEditMode.active = false;
    budgetItemEditMode.id = null;
    budgetItemEditMode.item = null;
    
    // Limpiar formulario
    document.getElementById('budgetItemName').value = '';
    document.getElementById('budgetItemDescription').value = '';
    document.getElementById('budgetItemEstimated').value = '';
    document.getElementById('budgetItemImage').value = '';
    
    if (document.getElementById('imagePreview')) {
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('imagePreview').innerHTML = '';
    }
    
    // Restaurar botón submit
    const submitButton = document.querySelector('#activeBudgetContainer form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = '✅ Agregar al Presupuesto';
        submitButton.classList.remove('btn-edit-mode');
    }
    
    // Remover botón cancelar
    const cancelButton = document.getElementById('cancelEditBudgetItemBtn');
    if (cancelButton) {
        cancelButton.remove();
    }
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
                        ${item.conTarjeta ? `
                            <div class="budget-item-price">
                                <span class="price-label">💳 Tarjeta de Crédito</span>
                                <span class="price-value">${item.cuotas} cuota${item.cuotas > 1 ? 's' : ''}</span>
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
                <div class="budget-item-footer">
                    <div class="real-price-section">
                        <div class="budget-item-checkbox">
                            <input type="checkbox" id="check-${item.id}" 
                                ${item.comprado ? 'checked' : ''} 
                                onchange="toggleBudgetItemComprado('${item.id}')">
                            <label for="check-${item.id}">Comprado</label>
                        </div>
                        ${item.comprado ? `
                            <input type="number" 
                                id="realPrice-${item.id}"
                                class="real-price-input" 
                                placeholder="Ingrese valor real"
                                value="${item.valorReal || ''}"
                                step="0.01">
                            <div class="budget-item-checkbox" style="margin-left: 10px;">
                                <input type="checkbox" id="checkTdc-${item.id}" 
                                    ${item.conTarjeta ? 'checked' : ''}
                                    onchange="document.getElementById('cuotas-${item.id}').style.display = this.checked ? 'inline-block' : 'none'">
                                <label for="checkTdc-${item.id}">💳 TDC</label>
                            </div>
                            <input type="number" 
                                id="cuotas-${item.id}"
                                class="real-price-input" 
                                placeholder="Cuotas"
                                value="${item.cuotas || ''}"
                                min="1"
                                style="width: 80px; display: ${item.conTarjeta ? 'inline-block' : 'none'};">
                            <button class="btn-save-price" 
                                    id="saveBtn-${item.id}"
                                    onclick="saveRealPrice('${item.id}')">
                                Guardar
                            </button>
                        ` : ''}
                    </div>
                    <div class="budget-item-actions">
                        <button class="btn-edit-budget" onclick="editBudgetItem('${item.id}')">
                            ✏️ Editar
                        </button>
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
            data.presupuestoItems[itemIndex].conTarjeta = false;
            data.presupuestoItems[itemIndex].cuotas = null;
            
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
        renderItemsComprados();
    }
}

// Nueva función para guardar el valor real
async function saveRealPrice(id) {
    const itemIndex = data.presupuestoItems.findIndex(item => item.id === id);
    const inputElement = document.getElementById(`realPrice-${id}`);
    const tdcCheckbox = document.getElementById(`checkTdc-${id}`);
    const cuotasInput = document.getElementById(`cuotas-${id}`);
    
    if (itemIndex === -1 || !inputElement) return;
    
    const value = parseFloat(inputElement.value);
    
    if (!value || value <= 0) {
        showNotification('Valor inválido', 'Ingresa un valor mayor a 0', 'error');
        return;
    }
    
    const conTarjeta = tdcCheckbox ? tdcCheckbox.checked : false;
    const cuotas = conTarjeta && cuotasInput ? parseInt(cuotasInput.value) || 1 : null;
    
    if (conTarjeta && (!cuotas || cuotas < 1)) {
        showNotification('Cuotas inválidas', 'Ingresa un número válido de cuotas', 'error');
        return;
    }
    
    // Guardar los valores anteriores por si hay error
    const previousValue = data.presupuestoItems[itemIndex].valorReal;
    const previousTdc = data.presupuestoItems[itemIndex].conTarjeta;
    const previousCuotas = data.presupuestoItems[itemIndex].cuotas;
    
    data.presupuestoItems[itemIndex].valorReal = value;
    data.presupuestoItems[itemIndex].conTarjeta = conTarjeta;
    data.presupuestoItems[itemIndex].cuotas = cuotas;
    
    try {
        // Actualizar en Firebase
        await updatePresupuestoItemInFirebase(data.presupuestoItems[itemIndex]);
        
        // Actualizar UI
        renderBudgetItems();
        renderBudgetSummary();
        renderItemsComprados();
        
        showNotification('Precio guardado', 'El valor real se ha guardado correctamente', 'success');
    } catch (error) {
        console.error('Error al actualizar precio:', error);
        // Revertir cambios en caso de error
        data.presupuestoItems[itemIndex].valorReal = previousValue;
        data.presupuestoItems[itemIndex].conTarjeta = previousTdc;
        data.presupuestoItems[itemIndex].cuotas = previousCuotas;
        showNotification('Error', 'No se pudo guardar el precio. Intenta nuevamente.', 'error');
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
                renderItemsComprados();
                
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

// ==================== DASHBOARD CON GRÁFICAS ====================
let chartInstances = {}; // Para almacenar instancias de gráficas y poder destruirlas

function renderDashboard() {
    console.log('🎨 Renderizando Dashboard...');
    
    // Destruir gráficas existentes
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
    chartInstances = {};
    
    // Calcular totales
    const totalGastosARS = data.gastos
        .filter(g => g.moneda === 'ARS')
        .reduce((sum, g) => sum + parseFloat(g.cantidad || 0), 0);
    
    const totalGastosUSD = data.gastos
        .filter(g => g.moneda === 'USD')
        .reduce((sum, g) => sum + parseFloat(g.cantidad || 0), 0);
    
    // Calcular tasa promedio para convertir USD a ARS
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    const totalGastos = totalGastosARS + (totalGastosUSD * tasaPromedio);
    const totalPagos = data.pagos.reduce((sum, p) => sum + parseFloat(p.cantidad || 0), 0);
    const totalPresupuestosComprados = data.presupuestoItems
        .filter(item => item.comprado && item.valorReal)
        .reduce((sum, item) => sum + parseFloat(item.valorReal || 0), 0);
    const totalObra = totalGastos + totalPresupuestosComprados;
    
    // Actualizar tarjetas de resumen
    document.getElementById('dashTotalObra').textContent = `$${formatCurrency(totalObra)}`;
    document.getElementById('dashTotalGastos').textContent = `$${formatCurrency(totalGastos)}`;
    document.getElementById('dashTotalPresupuestos').textContent = `$${formatCurrency(totalPresupuestosComprados)}`;
    document.getElementById('dashTotalPagos').textContent = `$${formatCurrency(totalPagos)}`;
    
    // Renderizar cada gráfica
    renderCategoriesChart();
    renderPresupuestoRealChart();
    renderEvolucionChart();
    renderMetodosPagoChart();
    renderEstadoItemsChart();
    renderTopCategoriasChart();
}

function renderCategoriesChart() {
    const ctx = document.getElementById('chartCategories');
    if (!ctx) return;
    
    // Agrupar gastos por categoría
    const categoryData = {};
    
    // Agregar gastos directos (convertir USD a ARS)
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    data.gastos.forEach(gasto => {
        const cat = gasto.categoria || 'Sin categoría';
        const monto = gasto.moneda === 'USD' 
            ? parseFloat(gasto.cantidad || 0) * tasaPromedio
            : parseFloat(gasto.cantidad || 0);
        categoryData[cat] = (categoryData[cat] || 0) + monto;
    });
    
    // Agregar presupuestos comprados
    const categoryNames = {
        'baño': '🚿 Baño',
        'cocina': '🍳 Cocina',
        'dormitorio': '🛏️ Dormitorio',
        'living': '🛋️ Living/Comedor',
        'exterior': '🏡 Exterior',
        'estructura': '🏗️ Estructura',
        'instalaciones': '🔧 Instalaciones',
        'terminaciones': '🎨 Terminaciones',
        'otros': '📦 Otros'
    };
    
    data.presupuestoItems.forEach(item => {
        if (item.comprado && item.valorReal) {
            const presupuesto = data.presupuestos.find(p => p.id === item.presupuestoId);
            if (presupuesto && presupuesto.categoria) {
                const cat = categoryNames[presupuesto.categoria] || presupuesto.categoria;
                categoryData[cat] = (categoryData[cat] || 0) + parseFloat(item.valorReal || 0);
            }
        }
    });
    
    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);
    
    // Colores vibrantes
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
        '#36A2EB', '#FFCE56'
    ];
    
    chartInstances.categories = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        font: { size: 12 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderPresupuestoRealChart() {
    const ctx = document.getElementById('chartPresupuestoReal');
    if (!ctx) return;
    
    // Agrupar por presupuesto
    const presupuestoData = {};
    
    data.presupuestos.forEach(presupuesto => {
        const items = data.presupuestoItems.filter(i => i.presupuestoId === presupuesto.id);
        const estimado = items.reduce((sum, i) => sum + parseFloat(i.valorEstimado || 0), 0);
        const real = items.filter(i => i.comprado && i.valorReal)
            .reduce((sum, i) => sum + parseFloat(i.valorReal || 0), 0);
        
        if (estimado > 0 || real > 0) {
            presupuestoData[presupuesto.nombre] = { estimado, real };
        }
    });
    
    const labels = Object.keys(presupuestoData);
    const estimados = labels.map(l => presupuestoData[l].estimado);
    const reales = labels.map(l => presupuestoData[l].real);
    
    chartInstances.presupuestoReal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Presupuestado',
                    data: estimados,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Real',
                    data: reales,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return '$' + formatCurrency(value);
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff', font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
}

function renderEvolucionChart() {
    const ctx = document.getElementById('chartEvolucion');
    if (!ctx) return;
    
    // Agrupar gastos por mes
    const monthlyData = {};
    
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    data.gastos.forEach(gasto => {
        const date = new Date(gasto.fecha);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monto = gasto.moneda === 'USD' 
            ? parseFloat(gasto.cantidad || 0) * tasaPromedio
            : parseFloat(gasto.cantidad || 0);
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + monto;
    });
    
    // Agregar items comprados por mes
    data.presupuestoItems.forEach(item => {
        if (item.comprado && item.valorReal && item.fechaCompra) {
            const date = new Date(item.fechaCompra);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(item.valorReal || 0);
        }
    });
    
    // Ordenar por fecha
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    });
    const values = sortedMonths.map(m => monthlyData[m]);
    
    chartInstances.evolucion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos Mensuales',
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return '$' + formatCurrency(value);
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff', font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Gastos: $${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
}

function renderMetodosPagoChart() {
    const ctx = document.getElementById('chartMetodosPago');
    if (!ctx) return;
    
    let efectivo = 0;
    let tarjeta = 0;
    
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    // Gastos (todos en efectivo ya que no tienen campo conTarjeta)
    data.gastos.forEach(gasto => {
        const monto = gasto.moneda === 'USD' 
            ? parseFloat(gasto.cantidad || 0) * tasaPromedio
            : parseFloat(gasto.cantidad || 0);
        efectivo += monto;
    });
    
    // Items comprados
    data.presupuestoItems.forEach(item => {
        if (item.comprado && item.valorReal) {
            if (item.conTarjeta) {
                tarjeta += parseFloat(item.valorReal || 0);
            } else {
                efectivo += parseFloat(item.valorReal || 0);
            }
        }
    });
    
    chartInstances.metodosPago = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['💵 Efectivo', '💳 Tarjeta de Crédito'],
            datasets: [{
                data: [efectivo, tarjeta],
                backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff', font: { size: 12 }, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: $${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderEstadoItemsChart() {
    const ctx = document.getElementById('chartEstadoItems');
    if (!ctx) return;
    
    const comprados = data.presupuestoItems.filter(i => i.comprado).length;
    const pendientes = data.presupuestoItems.filter(i => !i.comprado).length;
    
    chartInstances.estadoItems = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['✅ Comprados', '⏳ Pendientes'],
            datasets: [{
                data: [comprados, pendientes],
                backgroundColor: ['rgba(76, 175, 80, 0.8)', 'rgba(255, 152, 0, 0.8)'],
                borderColor: ['rgba(76, 175, 80, 1)', 'rgba(255, 152, 0, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff', font: { size: 12 }, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} items (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderTopCategoriasChart() {
    const ctx = document.getElementById('chartTopCategorias');
    if (!ctx) return;
    
    // Agrupar por categoría (igual que en renderCategoriesChart)
    const categoryData = {};
    
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    data.gastos.forEach(gasto => {
        const cat = gasto.categoria || 'Sin categoría';
        const monto = gasto.moneda === 'USD' 
            ? parseFloat(gasto.cantidad || 0) * tasaPromedio
            : parseFloat(gasto.cantidad || 0);
        categoryData[cat] = (categoryData[cat] || 0) + monto;
    });
    
    const categoryNames = {
        'baño': '🚿 Baño',
        'cocina': '🍳 Cocina',
        'dormitorio': '🛏️ Dormitorio',
        'living': '🛋️ Living/Comedor',
        'exterior': '🏡 Exterior',
        'estructura': '🏗️ Estructura',
        'instalaciones': '🔧 Instalaciones',
        'terminaciones': '🎨 Terminaciones',
        'otros': '📦 Otros'
    };
    
    data.presupuestoItems.forEach(item => {
        if (item.comprado && item.valorReal) {
            const presupuesto = data.presupuestos.find(p => p.id === item.presupuestoId);
            if (presupuesto && presupuesto.categoria) {
                const cat = categoryNames[presupuesto.categoria] || presupuesto.categoria;
                categoryData[cat] = (categoryData[cat] || 0) + parseFloat(item.valorReal || 0);
            }
        }
    });
    
    // Ordenar y tomar top 10
    const sortedCategories = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = sortedCategories.map(c => c[0]);
    const values = sortedCategories.map(c => c[1]);
    
    chartInstances.topCategorias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gasto Total',
                data: values,
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return '$' + formatCurrency(value);
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#fff', font: { size: 11 } },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Gasto: $${formatCurrency(context.parsed.x)}`;
                        }
                    }
                }
            }
        }
    });
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


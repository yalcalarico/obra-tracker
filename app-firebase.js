// Versión de app.js integrada con Firebase
// Este archivo reemplaza las funciones que usan localStorage por Firebase

// Inicializar datos
let data = {
    gastos: [],
    pagos: [],
    cambios: [],
    avances: []
};

// Variables para modo edición
let editMode = {
    active: false,
    type: null,
    id: null
};

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
        
        // Agregar a array local
        data.gastos.push(gasto);
        
        // Limpiar formulario
        event.target.reset();
        document.getElementById('gastoFecha').valueAsDate = new Date();
        
        // Actualizar UI
        renderGastos();
        renderResumen();
        
        console.log('✅ Gasto agregado');
    } catch (error) {
        console.error('Error al agregar gasto:', error);
        alert('Error al guardar el gasto. Intenta nuevamente.');
    }
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
                    <span class="item-amount">${gasto.moneda} $${gasto.cantidad.toFixed(2)}</span>
                    <button onclick="deleteGasto('${gasto.id}')" class="btn-delete">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
}

function filterGastos() {
    renderGastos();
}

async function deleteGasto(id) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    
    try {
        // Eliminar de Firebase
        await deleteFromFirebase('gastos', id);
        
        // Eliminar del array local
        data.gastos = data.gastos.filter(g => g.id !== id);
        
        // Actualizar UI
        renderGastos();
        renderResumen();
        
        console.log('✅ Gasto eliminado');
    } catch (error) {
        console.error('Error al eliminar gasto:', error);
        alert('Error al eliminar el gasto. Intenta nuevamente.');
    }
}

// ==================== PAGOS ====================
async function addPago(event) {
    event.preventDefault();
    
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
        
        console.log('✅ Pago agregado');
    } catch (error) {
        console.error('Error al agregar pago:', error);
        alert('Error al guardar el pago. Intenta nuevamente.');
    }
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
                    <span class="item-amount">ARS $${pago.cantidad.toFixed(2)}</span>
                    <button onclick="deletePago('${pago.id}')" class="btn-delete">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
}

async function deletePago(id) {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;
    
    try {
        // Eliminar de Firebase
        await deleteFromFirebase('pagos', id);
        
        // Eliminar del array local
        data.pagos = data.pagos.filter(p => p.id !== id);
        
        // Actualizar UI
        renderPagos();
        renderResumen();
        
        console.log('✅ Pago eliminado');
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        alert('Error al eliminar el pago. Intenta nuevamente.');
    }
}

// ==================== CAMBIOS ====================
async function addCambio(event) {
    event.preventDefault();
    
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
        
        console.log('✅ Cambio agregado');
    } catch (error) {
        console.error('Error al agregar cambio:', error);
        alert('Error al guardar el cambio. Intenta nuevamente.');
    }
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
                    USD $${cambio.dolares.toFixed(2)} × ${cambio.tasa.toFixed(2)} = ARS $${cambio.pesos.toFixed(2)}
                </div>
                <div class="item-footer">
                    <span class="item-amount">Tasa: ${cambio.tasa.toFixed(2)}</span>
                    <button onclick="deleteCambio('${cambio.id}')" class="btn-delete">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
}

async function deleteCambio(id) {
    if (!confirm('¿Estás seguro de eliminar este cambio?')) return;
    
    try {
        // Eliminar de Firebase
        await deleteFromFirebase('cambios', id);
        
        // Eliminar del array local
        data.cambios = data.cambios.filter(c => c.id !== id);
        
        // Actualizar UI
        renderCambios();
        renderResumen();
        
        console.log('✅ Cambio eliminado');
    } catch (error) {
        console.error('Error al eliminar cambio:', error);
        alert('Error al eliminar el cambio. Intenta nuevamente.');
    }
}

// ==================== AVANCES ====================
async function addAvance(event) {
    event.preventDefault();
    
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
        
        console.log('✅ Avance agregado');
    } catch (error) {
        console.error('Error al agregar avance:', error);
        alert('Error al guardar el avance. Intenta nuevamente.');
    }
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
    if (!confirm('¿Estás seguro de eliminar este avance?')) return;
    
    try {
        // Eliminar de Firebase
        await deleteFromFirebase('avances', id);
        
        // Eliminar del array local
        data.avances = data.avances.filter(a => a.id !== id);
        
        // Actualizar UI
        renderAvances();
        
        console.log('✅ Avance eliminado');
    } catch (error) {
        console.error('Error al eliminar avance:', error);
        alert('Error al eliminar el avance. Intenta nuevamente.');
    }
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
    
    const totalCambios = data.cambios.reduce((sum, c) => sum + c.pesos, 0);
    
    // Calcular promedio de tasa de cambio
    const tasaPromedio = data.cambios.length > 0
        ? data.cambios.reduce((sum, c) => sum + c.tasa, 0) / data.cambios.length
        : 1000;
    
    const totalGeneral = totalGastosARS + (totalGastosUSD * tasaPromedio) + totalPagos;
    
    // Renderizar resumen general
    general.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-icon">💰</div>
                <div class="summary-label">Gastos en ARS</div>
                <div class="summary-value">$${totalGastosARS.toFixed(2)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">💵</div>
                <div class="summary-label">Gastos en USD</div>
                <div class="summary-value">$${totalGastosUSD.toFixed(2)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">👷</div>
                <div class="summary-label">Total Pagos</div>
                <div class="summary-value">$${totalPagos.toFixed(2)}</div>
            </div>
            <div class="summary-card highlight">
                <div class="summary-icon">📊</div>
                <div class="summary-label">Total General (ARS)</div>
                <div class="summary-value">$${totalGeneral.toFixed(2)}</div>
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
                            <span class="categoria-nombre">${categoria}</span>
                            <span class="categoria-monto">$${total.toFixed(2)} (${porcentaje}%)</span>
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

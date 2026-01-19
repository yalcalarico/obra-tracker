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
    loadData();
    renderGastos();
    renderPagos();
    renderCambios();
    renderAvances();
    renderResumen();
    
    // Establecer fecha actual por defecto
    document.getElementById('gastoFecha').valueAsDate = new Date();
    document.getElementById('cambioFecha').valueAsDate = new Date();
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
    
    // Mostrar el historial seleccionado
    document.getElementById(`historial-${tipo}`).classList.add('active');
    event.target.classList.add('active');
}

// GASTOS
function addGasto(event) {
    event.preventDefault();
    
    const gasto = {
        id: editMode.active && editMode.type === 'gasto' ? editMode.id :  Date.now(),
        fecha: document.getElementById('gastoFecha').value,
        descripcion: document.getElementById('gastoDescripcion').value,
        categoria: document.getElementById('gastoCategoria').value,
        cantidad: parseFloat(document.getElementById('gastoCantidad').value),
        moneda: document.getElementById('gastoMoneda').value
    };
    
    if (editMode.active && editMode.type === 'gasto') {
        // Modo edición: actualizar el registro existente
        const index = data.gastos.findIndex(g => g.id === editMode.id);
        if (index !== -1) {
            data.gastos[index] = gasto;
        }
        cancelEdit();
        alert('✅ Gasto actualizado correctamente');
    } else {
        // Modo creación: agregar nuevo registro
        data.gastos.push(gasto);
        alert('✅ Gasto registrado correctamente');
    }
    
    saveData();
    renderGastos();
    event.target.reset();
    document.getElementById('gastoFecha').valueAsDate = new Date();
}

function editGasto(id) {
    const gasto = data.gastos.find(g => g.id === id);
    if (! gasto) return;
    
    // Establecer modo edición
    editMode = {
        active: true,
        type: 'gasto',
        id: id
    };
    
    // Llenar el formulario con los datos
    document.getElementById('gastoFecha').value = gasto.fecha;
    document.getElementById('gastoDescripcion').value = gasto.descripcion;
    document.getElementById('gastoCategoria').value = gasto.categoria;
    document.getElementById('gastoCantidad').value = gasto.cantidad;
    document.getElementById('gastoMoneda').value = gasto.moneda;
    
    // Cambiar al tab de nuevo gasto
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('. tab').forEach(tab => tab. classList.remove('active'));
    document.getElementById('tab-nuevo-gasto').classList.add('active');
    document.querySelector('[onclick="showTab(\'nuevo-gasto\')"]').classList.add('active');
    
    // Cambiar el texto del botón
    const submitBtn = document.querySelector('#tab-nuevo-gasto .btn-primary');
    submitBtn.textContent = '✏️ Actualizar Gasto';
    submitBtn.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
    
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteGasto(id) {
    if (confirm('¿Eliminar este gasto?')) {
        data.gastos = data. gastos.filter(g => g.id !== id);
        saveData();
        renderGastos();
        renderResumen();
    }
}

function filterGastos() {
    renderGastos();
}

function renderGastos() {
    const filtro = document.getElementById('filtroCategoria').value;
    const gastos = filtro 
        ? data.gastos. filter(g => g.categoria === filtro)
        : data.gastos;
    
    const lista = document.getElementById('gastosLista');
    
    if (gastos.length === 0) {
        lista.innerHTML = '<p style="text-align:  center; color:#999; padding: 30px;">No hay gastos registrados</p>';
        return;
    }
    
    lista. innerHTML = gastos
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(gasto => `
            <div class="item">
                <div class="item-content">
                    <strong>${gasto.descripcion}</strong>
                    <div>${gasto.categoria} • ${new Date(gasto.fecha).toLocaleDateString('es-AR')}</div>
                    <div style="font-size: 1.2em; color: #1e3c72; font-weight: bold; margin-top: 5px;">
                        $${gasto.cantidad.toFixed(2)} ${gasto.moneda}
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="editGasto(${gasto.id})" class="btn-edit">✏️</button>
                    <button onclick="deleteGasto(${gasto.id})" class="btn-danger">🗑️</button>
                </div>
            </div>
        `).join('');
}

// PAGOS SEMANALES
function addPago(event) {
    event.preventDefault();
    
    const pago = {
        id: editMode.active && editMode.type === 'pago' ? editMode.id : Date.now(),
        semana: document.getElementById('pagoSemana').value,
        trabajador: document.getElementById('pagoTrabajador').value,
        cantidad: parseFloat(document.getElementById('pagoCantidad').value),
        notas: document.getElementById('pagoNotas').value
    };
    
    if (editMode. active && editMode.type === 'pago') {
        const index = data.pagos.findIndex(p => p.id === editMode.id);
        if (index !== -1) {
            data.pagos[index] = pago;
        }
        cancelEdit();
        alert('✅ Pago actualizado correctamente');
    } else {
        data.pagos.push(pago);
        alert('✅ Pago registrado correctamente');
    }
    
    saveData();
    renderPagos();
    event.target.reset();
}

function editPago(id) {
    const pago = data.pagos.find(p => p.id === id);
    if (!pago) return;
    
    editMode = {
        active: true,
        type: 'pago',
        id: id
    };
    
    document. getElementById('pagoSemana').value = pago.semana;
    document.getElementById('pagoTrabajador').value = pago.trabajador;
    document.getElementById('pagoCantidad').value = pago.cantidad;
    document.getElementById('pagoNotas').value = pago.notas;
    
    document. querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList. remove('active'));
    document.getElementById('tab-nuevo-pago').classList.add('active');
    document.querySelector('[onclick="showTab(\'nuevo-pago\')"]').classList.add('active');
    
    const submitBtn = document.querySelector('#tab-nuevo-pago .btn-primary');
    submitBtn.textContent = '✏️ Actualizar Pago';
    submitBtn.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deletePago(id) {
    if (confirm('¿Eliminar este pago? ')) {
        data.pagos = data.pagos.filter(p => p.id !== id);
        saveData();
        renderPagos();
        renderResumen();
    }
}

function renderPagos() {
    const lista = document.getElementById('pagosLista');
    
    if (data.pagos.length === 0) {
        lista.innerHTML = '<p style="text-align:  center; color:#999; padding:  30px;">No hay pagos registrados</p>';
        return;
    }
    
    lista.innerHTML = data.pagos
        .sort((a, b) => b.semana. localeCompare(a.semana))
        .map(pago => `
            <div class="item">
                <div class="item-content">
                    <strong>${pago.trabajador}</strong>
                    <div>Semana: ${pago. semana}</div>
                    ${pago.notas ? `<div style="color:#666; font-size: 0.9em; margin-top: 5px;">${pago.notas}</div>` : ''}
                    <div style="font-size:  1.2em; color: #1e3c72; font-weight: bold; margin-top: 5px;">
                        $${pago.cantidad.toFixed(2)} ARS
                    </div>
                </div>
                <div style="display: flex; gap:  10px;">
                    <button onclick="editPago(${pago.id})" class="btn-edit">✏️</button>
                    <button onclick="deletePago(${pago.id})" class="btn-danger">🗑️</button>
                </div>
            </div>
        `).join('');
}

// CAMBIO DE MONEDA
function addCambio(event) {
    event.preventDefault();
    
    const cambio = {
        id:  editMode.active && editMode. type === 'cambio' ?  editMode.id : Date.now(),
        fecha: document.getElementById('cambioFecha').value,
        dolares: parseFloat(document.getElementById('cambioDolares').value),
        tasa: parseFloat(document.getElementById('cambioTasa').value),
        pesos: parseFloat(document.getElementById('cambioPesos').value)
    };
    
    if (editMode.active && editMode.type === 'cambio') {
        const index = data.cambios.findIndex(c => c.id === editMode.id);
        if (index !== -1) {
            data.cambios[index] = cambio;
        }
        cancelEdit();
        alert('✅ Cambio actualizado correctamente');
    } else {
        data.cambios. push(cambio);
        alert('✅ Cambio registrado correctamente');
    }
    
    saveData();
    renderCambios();
    event.target.reset();
    document.getElementById('cambioFecha').valueAsDate = new Date();
}

function editCambio(id) {
    const cambio = data.cambios.find(c => c.id === id);
    if (!cambio) return;
    
    editMode = {
        active: true,
        type: 'cambio',
        id: id
    };
    
    document.getElementById('cambioFecha').value = cambio.fecha;
    document.getElementById('cambioDolares').value = cambio.dolares;
    document.getElementById('cambioTasa').value = cambio.tasa;
    document. getElementById('cambioPesos').value = cambio.pesos;
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-nuevo-cambio').classList.add('active');
    document.querySelector('[onclick="showTab(\'nuevo-cambio\')"]').classList.add('active');
    
    const submitBtn = document. querySelector('#tab-nuevo-cambio .btn-primary');
    submitBtn.textContent = '✏️ Actualizar Cambio';
    submitBtn.style. background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCambio(id) {
    if (confirm('¿Eliminar este cambio?')) {
        data.cambios = data.cambios.filter(c => c. id !== id);
        saveData();
        renderCambios();
        renderResumen();
    }
}

function renderCambios() {
    const lista = document.getElementById('cambiosLista');
    
    if (data.cambios.length === 0) {
        lista.innerHTML = '<p style="text-align:  center; color:#999; padding:  30px;">No hay cambios registrados</p>';
        return;
    }
    
    lista.innerHTML = data.cambios
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(cambio => `
            <div class="item">
                <div class="item-content">
                    <strong>${new Date(cambio.fecha).toLocaleDateString('es-AR')}</strong>
                    <div>$${cambio.dolares.toFixed(2)} USD × ${cambio.tasa.toFixed(2)} = $${cambio.pesos.toFixed(2)} ARS</div>
                    <div style="color:#666; font-size: 0.9em; margin-top: 5px;">Tasa: $${cambio.tasa.toFixed(2)} ARS por dólar</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="editCambio(${cambio.id})" class="btn-edit">✏️</button>
                    <button onclick="deleteCambio(${cambio.id})" class="btn-danger">🗑️</button>
                </div>
            </div>
        `).join('');
}

// AVANCE SEMANAL
function updatePorcentaje(value) {
    document.getElementById('porcentajeValue').textContent = value + '%';
}

function addAvance(event) {
    event.preventDefault();
    
    const avance = {
        id: editMode.active && editMode.type === 'avance' ? editMode.id : Date.now(),
        semana: document.getElementById('avanceSemana').value,
        titulo: document.getElementById('avanceTitulo').value,
        descripcion: document.getElementById('avanceDescripcion').value,
        porcentaje: parseInt(document.getElementById('avancePorcentaje').value)
    };
    
    if (editMode.active && editMode.type === 'avance') {
        const index = data. avances.findIndex(a => a.id === editMode.id);
        if (index !== -1) {
            data.avances[index] = avance;
        }
        cancelEdit();
        alert('✅ Avance actualizado correctamente');
    } else {
        data. avances.push(avance);
        alert('✅ Avance registrado correctamente');
    }
    
    saveData();
    renderAvances();
    event.target.reset();
    document.getElementById('avancePorcentaje').value = 0;
    updatePorcentaje(0);
}

function editAvance(id) {
    const avance = data.avances.find(a => a.id === id);
    if (!avance) return;
    
    editMode = {
        active: true,
        type: 'avance',
        id: id
    };
    
    document.getElementById('avanceSemana').value = avance.semana;
    document.getElementById('avanceTitulo').value = avance.titulo;
    document.getElementById('avanceDescripcion').value = avance.descripcion;
    document. getElementById('avancePorcentaje').value = avance.porcentaje;
    updatePorcentaje(avance. porcentaje);
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('. tab').forEach(tab => tab. classList.remove('active'));
    document.getElementById('tab-nuevo-avance').classList.add('active');
    document.querySelector('[onclick="showTab(\'nuevo-avance\')"]').classList.add('active');
    
    const submitBtn = document.querySelector('#tab-nuevo-avance .btn-primary');
    submitBtn.textContent = '✏️ Actualizar Avance';
    submitBtn.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteAvance(id) {
    if (confirm('¿Eliminar este avance? ')) {
        data.avances = data.avances.filter(a => a.id !== id);
        saveData();
        renderAvances();
    }
}

function renderAvances() {
    const lista = document.getElementById('avancesLista');
    
    if (data.avances.length === 0) {
        lista.innerHTML = '<p style="text-align:  center; color:#999; padding:  30px;">No hay avances registrados</p>';
        return;
    }
    
    lista.innerHTML = data.avances
        .sort((a, b) => b.semana.localeCompare(a.semana))
        .map(avance => `
            <div class="item" style="flex-direction: column; align-items: flex-start;">
                <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                        <strong>${avance.titulo}</strong>
                        <div style="color:#666; font-size: 0.9em;">Semana: ${avance. semana}</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="editAvance(${avance.id})" class="btn-edit">✏️</button>
                        <button onclick="deleteAvance(${avance. id})" class="btn-danger">🗑️</button>
                    </div>
                </div>
                <p style="margin:  10px 0; color: #555;">${avance.descripcion}</p>
                <div style="width: 100%;">
                    <div class="categoria-bar">
                        <div class="categoria-bar-fill" style="width: ${avance.porcentaje}%">
                            ${avance.porcentaje}%
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
}

// Cancelar modo edición
function cancelEdit() {
    editMode = {
        active: false,
        type:  null,
        id: null
    };
    
    // Restaurar botones a su estado original
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Actualizar')) {
            btn.textContent = btn.textContent.replace('✏️ Actualizar', '✅ Registrar');
            btn.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
        }
    });
}

// RESUMEN
function renderResumen() {
    // Calcular totales
    const totalGastosARS = data.gastos
        .filter(g => g. moneda === 'ARS')
        .reduce((sum, g) => sum + g.cantidad, 0);
    
    const totalGastosUSD = data.gastos
        .filter(g => g.moneda === 'USD')
        .reduce((sum, g) => sum + g.cantidad, 0);
    
    const totalPagos = data.pagos.reduce((sum, p) => sum + p.cantidad, 0);
    
    const totalDolaresComprados = data.cambios. reduce((sum, c) => sum + c.dolares, 0);
    const totalPesosCambiados = data.cambios. reduce((sum, c) => sum + c.pesos, 0);
    
    // Calcular tasa promedio de cambio
    const tasaPromedio = data.cambios.length > 0 
        ? (totalPesosCambiados / totalDolaresComprados).toFixed(2)
        : 0;
    
    // Resumen general
    document.getElementById('resumenGeneral').innerHTML = `
        <div class="resumen-item">
            <span><strong>💵 Total Gastos en Pesos: </strong></span>
            <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${totalGastosARS.toFixed(2)} ARS</span>
        </div>
        <div class="resumen-item">
            <span><strong>💵 Total Gastos en Dólares:</strong></span>
            <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${totalGastosUSD.toFixed(2)} USD</span>
        </div>
        <div class="resumen-item">
            <span><strong>👷 Total Pagos a Trabajadores:</strong></span>
            <span style="font-size:  1.3em; color:#1e3c72; font-weight: bold;">$${totalPagos.toFixed(2)} ARS</span>
        </div>
        <div class="resumen-item">
            <span><strong>💱 Dólares Cambiados:</strong></span>
            <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${totalDolaresComprados.toFixed(2)} USD → $${totalPesosCambiados.toFixed(2)} ARS</span>
        </div>
        ${data.cambios.length > 0 ? `
        <div class="resumen-item">
            <span><strong>📊 Tasa Promedio de Cambio:</strong></span>
            <span style="font-size: 1.3em; color:#1e3c72; font-weight: bold;">$${tasaPromedio} ARS/USD</span>
        </div>
        ` : ''}
        <div class="resumen-item" style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px;">
            <span><strong>💰 TOTAL GENERAL:</strong></span>
            <span style="font-size: 1.5em; font-weight: bold;">$${(totalGastosARS + totalPagos + totalPesosCambiados).toFixed(2)} ARS</span>
        </div>
    `;
    
    // Gastos por categoría
    const categorias = {};
    data.gastos.forEach(gasto => {
        if (!categorias[gasto.categoria]) {
            categorias[gasto. categoria] = 0;
        }
        const tasaConversion = tasaPromedio > 0 ? tasaPromedio : 1000;
        const cantidad = gasto.moneda === 'USD' ? gasto.cantidad * tasaConversion : gasto. cantidad;
        categorias[gasto.categoria] += cantidad;
    });
    
    const totalCategorias = Object.values(categorias).reduce((sum, val) => sum + val, 0);
    
    if (totalCategorias > 0) {
        document.getElementById('resumenCategorias').innerHTML = Object.entries(categorias)
            .sort((a, b) => b[1] - a[1])
            .map(([categoria, total]) => {
                const porcentaje = (total / totalCategorias * 100).toFixed(1);
                return `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong style="color: #333;">${categoria}</strong>
                            <span style="color: #1e3c72; font-weight: bold;">$${total.toFixed(2)} ARS (${porcentaje}%)</span>
                        </div>
                        <div class="categoria-bar">
                            <div class="categoria-bar-fill" style="width: ${porcentaje}%">${porcentaje}%</div>
                        </div>
                    </div>
                `;
            }).join('');
    } else {
        document. getElementById('resumenCategorias').innerHTML = '<p style="text-align: center; color:#999; padding: 30px;">No hay gastos por categoría</p>';
    }
}

// PERSISTENCIA DE DATOS
function saveData() {
    localStorage.setItem('obraTrackerData', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('obraTrackerData');
    if (saved) {
        data = JSON.parse(saved);
    }
}

// EXPORTAR/IMPORTAR
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL. createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obra-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('✅ Datos exportados correctamente');
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                data = JSON.parse(e.target.result);
                saveData();
                renderGastos();
                renderPagos();
                renderCambios();
                renderAvances();
                renderResumen();
                alert('✅ Datos importados correctamente');
            } catch (error) {
                alert('❌ Error al importar datos:  ' + error.message);
            }
        };
        reader. readAsText(file);
    }
}

// Edit functions for each record type
function editGasto(id) {
    editMode.gastos = true;
    // logic to edit gasto with the given id
}

function editPago(id) {
    editMode.pagos = true;
    // logic to edit pago with the given id
}

function editCambio(id) {
    editMode.cambios = true;
    // logic to edit cambio with the given id
}

function editAvance(id) {
    editMode.avances = true;
    // logic to edit avance with the given id
}

// Function to cancel editing
function cancelEdit() {
    for (let type in editMode) {
        editMode[type] = false;
    }
    // logic to reset any changes made during editing
}
// Inicializar datos
let data = {
    gastos: [],
    pagos: [],
    cambios: [],
    avances: []
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

// Manejo de tabs
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
    event.target.classList.add('active');
    
    // Actualizar resumen si se abre esa tab
    if (tabName === 'resumen') {
        renderResumen();
    }
}

// GASTOS
function addGasto(event) {
    event.preventDefault();
    
    const gasto = {
        id: Date.now(),
        fecha: document.getElementById('gastoFecha').value,
        descripcion: document.getElementById('gastoDescripcion').value,
        categoria: document.getElementById('gastoCategoria').value,
        cantidad: parseFloat(document.getElementById('gastoCantidad').value),
        moneda: document.getElementById('gastoMoneda').value
    };
    
    data.gastos.push(gasto);
    saveData();
    renderGastos();
    event.target.reset();
    document.getElementById('gastoFecha').valueAsDate = new Date();
}

function deleteGasto(id) {
    if (confirm('¿Eliminar este gasto?')) {
        data.gastos = data.gastos.filter(g => g.id !== id);
        saveData();
        renderGastos();
    }
}

function filterGastos() {
    renderGastos();
}

function renderGastos() {
    const filtro = document.getElementById('filtroCategoria').value;
    const gastos = filtro 
        ? data.gastos.filter(g => g.categoria === filtro)
        : data.gastos;
    
    const lista = document.getElementById('gastosLista');
    
    if (gastos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color:#999;">No hay gastos registrados</p>';
        return;
    }
    
    lista.innerHTML = gastos
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
                <button onclick="deleteGasto(${gasto.id})" class="btn-danger">🗑️</button>
            </div>
        `).join('');
}

// PAGOS SEMANALES
function addPago(event) {
    event.preventDefault();
    
    const pago = {
        id: Date.now(),
        semana: document.getElementById('pagoSemana').value,
        trabajador: document.getElementById('pagoTrabajador').value,
        cantidad: parseFloat(document.getElementById('pagoCantidad').value),
        notas: document.getElementById('pagoNotas').value
    };
    
    data.pagos.push(pago);
    saveData();
    renderPagos();
    event.target.reset();
}

function deletePago(id) {
    if (confirm('¿Eliminar este pago?')) {
        data.pagos = data.pagos.filter(p => p.id !== id);
        saveData();
        renderPagos();
    }
}

function renderPagos() {
    const lista = document.getElementById('pagosLista');
    
    if (data.pagos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color:#999;">No hay pagos registrados</p>';
        return;
    }
    
    lista.innerHTML = data.pagos
        .sort((a, b) => b.semana.localeCompare(a.semana))
        .map(pago => `
            <div class="item">
                <div class="item-content">
                    <strong>${pago.trabajador}</strong>
                    <div>Semana: ${pago.semana}</div>
                    ${pago.notas ? `<div style="color:#666; font-size: 0.9em;">${pago.notas}</div>` : ''}
                    <div style="font-size: 1.2em; color: #1e3c72; font-weight: bold; margin-top: 5px;">
                        $${pago.cantidad.toFixed(2)} ARS
                    </div>
                </div>
                <button onclick="deletePago(${pago.id})" class="btn-danger">🗑️</button>
            </div>
        `).join('');
}

// CAMBIO DE MONEDA
function addCambio(event) {
    event.preventDefault();
    
    const cambio = {
        id: Date.now(),
        fecha: document.getElementById('cambioFecha').value,
        dolares: parseFloat(document.getElementById('cambioDolares').value),
        tasa: parseFloat(document.getElementById('cambioTasa').value),
        pesos: parseFloat(document.getElementById('cambioPesos').value)
    };
    
    data.cambios.push(cambio);
    saveData();
    renderCambios();
    event.target.reset();
    document.getElementById('cambioFecha').valueAsDate = new Date();
}

function deleteCambio(id) {
    if (confirm('¿Eliminar este cambio?')) {
        data.cambios = data.cambios.filter(c => c.id !== id);
        saveData();
        renderCambios();
    }
}

function renderCambios() {
    const lista = document.getElementById('cambiosLista');
    
    if (data.cambios.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color:#999;">No hay cambios registrados</p>';
        return;
    }
    
    lista.innerHTML = data.cambios
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(cambio => `
            <div class="item">
                <div class="item-content">
                    <strong>${new Date(cambio.fecha).toLocaleDateString('es-AR')}</strong>
                    <div>$${cambio.dolares.toFixed(2)} USD × ${cambio.tasa.toFixed(2)} = $${cambio.pesos.toFixed(2)} ARS</div>
                    <div style="color:#666; font-size: 0.9em;">Tasa: $${cambio.tasa.toFixed(2)} ARS por dólar</div>
                </div>
                <button onclick="deleteCambio(${cambio.id})" class="btn-danger">🗑️</button>
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
        id: Date.now(),
        semana: document.getElementById('avanceSemana').value,
        titulo: document.getElementById('avanceTitulo').value,
        descripcion: document.getElementById('avanceDescripcion').value,
        porcentaje: parseInt(document.getElementById('avancePorcentaje').value)
    };
    
    data.avances.push(avance);
    saveData();
    renderAvances();
    event.target.reset();
    document.getElementById('avancePorcentaje').value = 0;
    updatePorcentaje(0);
}

function deleteAvance(id) {
    if (confirm('¿Eliminar este avance?')) {
        data.avances = data.avances.filter(a => a.id !== id);
        saveData();
        renderAvances();
    }
}

function renderAvances() {
    const lista = document.getElementById('avancesLista');
    
    if (data.avances.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color:#999;">No hay avances registrados</p>';
        return;
    }
    
    lista.innerHTML = data.avances
        .sort((a, b) => b.semana.localeCompare(a.semana))
        .map(avance => `
            <div class="item" style="flex-direction: column; align-items: flex-start;">
                <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                        <strong>${avance.titulo}</strong>
                        <div style="color:#666; font-size: 0.9em;">Semana: ${avance.semana}</div>
                    </div>
                    <button onclick="deleteAvance(${avance.id})" class="btn-danger">🗑️</button>
                </div>
                <p style="margin: 10px 0;">${avance.descripcion}</p>
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

// RESUMEN
function renderResumen() {
    // Calcular totales
    const totalGastosARS = data.gastos
        .filter(g => g.moneda === 'ARS')
        .reduce((sum, g) => sum + g.cantidad, 0);
    
    const totalGastosUSD = data.gastos
        .filter(g => g.moneda === 'USD')
        .reduce((sum, g) => sum + g.cantidad, 0);
    
    const totalPagos = data.pagos.reduce((sum, p) => sum + p.cantidad, 0);
    
    const totalDolaresComprados = data.cambios.reduce((sum, c) => sum + c.dolares, 0);
    const totalPesosCambiados = data.cambios.reduce((sum, c) => sum + c.pesos, 0);
    
    // Calcular tasa promedio de cambio
    const tasaPromedio = data.cambios.length > 0 
        ? (totalPesosCambiados / totalDolaresComprados).toFixed(2)
        : 0;
    
    // Resumen general
    document.getElementById('resumenGeneral').innerHTML = `
        <div class="resumen-item">
            <span><strong>💵 Total Gastos en Pesos: </strong></span>
            <span style="font-size: 1.3em; color:#1e3c72;">$${totalGastosARS.toFixed(2)} ARS</span>
        </div>
        <div class="resumen-item">
            <span><strong>💵 Total Gastos en Dólares:</strong></span>
            <span style="font-size: 1.3em; color:#1e3c72;">$${totalGastosUSD.toFixed(2)} USD</span>
        </div>
        <div class="resumen-item">
            <span><strong>👷 Total Pagos a Trabajadores:</strong></span>
            <span style="font-size: 1.3em; color:#1e3c72;">$${totalPagos.toFixed(2)} ARS</span>
        </div>
        <div class="resumen-item">
            <span><strong>💱 Dólares Cambiados:</strong></span>
            <span style="font-size: 1.3em; color:#1e3c72;">$${totalDolaresComprados.toFixed(2)} USD → $${totalPesosCambiados.toFixed(2)} ARS</span>
        </div>
        ${data.cambios.length > 0 ? `
        <div class="resumen-item">
            <span><strong>📊 Tasa Promedio de Cambio:</strong></span>
            <span style="font-size: 1.3em; color:#1e3c72;">$${tasaPromedio} ARS/USD</span>
        </div>
        ` : ''}
        <div class="resumen-item" style="background:#1e3c72; color: white;">
            <span><strong>💰 TOTAL GENERAL:</strong></span>
            <span style="font-size: 1.5em; font-weight: bold;">$${(totalGastosARS + totalPagos + totalPesosCambiados).toFixed(2)} ARS</span>
        </div>
    `;
    
    // Gastos por categoría
    const categorias = {};
    data.gastos.forEach(gasto => {
        if (!categorias[gasto.categoria]) {
            categorias[gasto.categoria] = 0;
        }
        // Convertir USD a ARS si es necesario (usando tasa promedio o estimada)
        const tasaConversion = tasaPromedio > 0 ? tasaPromedio : 1000;
        const cantidad = gasto.moneda === 'USD' ? gasto.cantidad * tasaConversion : gasto.cantidad;
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
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <strong>${categoria}</strong>
                            <span>$${total.toFixed(2)} ARS (${porcentaje}%)</span>
                        </div>
                        <div class="categoria-bar">
                            <div class="categoria-bar-fill" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
    } else {
        document.getElementById('resumenCategorias').innerHTML = '<p style="text-align: center; color:#999;">No hay gastos por categoría</p>';
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
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obra-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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
                alert('Datos importados correctamente');
            } catch (error) {
                alert('Error al importar datos: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}
// Utilidad: obtener parámetros de la URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// =======================
// Listado de máquinas
// =======================
function cargarMaquinasListado() {
    fetch('data/maquinas-datos.json')
        .then(res => res.json())
        .then(maquinas => {
            // Variables de paginación y filtros
            const lista = document.getElementById('maquinas-listado');
            const searchInput = document.getElementById('busqueda-maquina');
            const ubicacionSelect = document.getElementById('filtro-ubicacion');
            let paginaActual = 1;
            const maquinasPorPagina = 5;

            // Obtener ubicaciones únicas (de los mantenimientos)
            const ubicaciones = [
                ...new Set(
                    maquinas.flatMap(m =>
                        m.mantenimientos?.map(mtto => mtto.ubicacion).filter(Boolean) || []
                    )
                )
            ];

            // Renderizar selector de ubicaciones
            if (ubicacionSelect) {
                ubicacionSelect.innerHTML = '<option value="">Todas las ubicaciones</option>';
                ubicaciones.forEach(ubi => {
                    ubicacionSelect.innerHTML += `<option value="${ubi}">${ubi}</option>`;
                });
            }

            // Lógica de búsqueda y paginación
            function renderMaquinas() {
                let filtro = searchInput ? searchInput.value.toLowerCase() : '';
                let filtroUbicacion = ubicacionSelect ? ubicacionSelect.value : '';
                // Se filtra por nombre o id y luego por ubicación (en mantenimientos)
                let filtradas = maquinas.filter(m => {
                    let coincideBusqueda = m.nombre.toLowerCase().includes(filtro) || m.id.toLowerCase().includes(filtro);
                    let coincideUbicacion = !filtroUbicacion ||
                        (Array.isArray(m.mantenimientos) && m.mantenimientos.some(mtto => mtto.ubicacion === filtroUbicacion));
                    return coincideBusqueda && coincideUbicacion;
                });

                // Paginación
                let totalPaginas = Math.ceil(filtradas.length / maquinasPorPagina);
                if (paginaActual > totalPaginas) paginaActual = totalPaginas || 1;
                let inicio = (paginaActual - 1) * maquinasPorPagina;
                let pagina = filtradas.slice(inicio, inicio + maquinasPorPagina);

                // Renderizado
                lista.innerHTML = '';
                if (pagina.length === 0) {
                    lista.innerHTML = '<p>No se encontraron máquinas.</p>';
                } else {
                    pagina.forEach(maquina => {
                        // Última ubicación registrada
                        let ultimaUbicacion = '';
                        if (Array.isArray(maquina.mantenimientos) && maquina.mantenimientos.length > 0) {
                            ultimaUbicacion = maquina.mantenimientos[maquina.mantenimientos.length - 1].ubicacion || '';
                        }
                        lista.innerHTML += `
                            <div class="maquina-item">
                                <h3>${maquina.nombre}</h3>
                                <p><strong>Ubicación:</strong> ${ultimaUbicacion}</p>
                                <a href="maquina-historial-detalle.html?id=${maquina.id}">Ver historial</a>
                                ${maquina.qr ? `<img src="qr/${maquina.qr}" alt="QR" class="qr-img">` : ''}
                            </div>
                        `;
                    });
                }

                // Controles de paginación
                if (totalPaginas > 1) {
                    lista.innerHTML += `
                        <div class="paginacion">
                            <button ${paginaActual === 1 ? 'disabled' : ''} id="btn-prev">Anterior</button>
                            <span>Página ${paginaActual} de ${totalPaginas}</span>
                            <button ${paginaActual === totalPaginas ? 'disabled' : ''} id="btn-next">Siguiente</button>
                        </div>
                    `;
                    document.getElementById('btn-prev').onclick = () => { paginaActual--; renderMaquinas(); };
                    document.getElementById('btn-next').onclick = () => { paginaActual++; renderMaquinas(); };
                }
            }

            // Eventos de búsqueda y filtro
            if (searchInput) searchInput.oninput = () => { paginaActual = 1; renderMaquinas(); };
            if (ubicacionSelect) ubicacionSelect.onchange = () => { paginaActual = 1; renderMaquinas(); };

            // Inicial
            renderMaquinas();
        })
        .catch(() => {
            document.getElementById('maquinas-listado').innerHTML = '<p>Error al cargar los datos de máquinas.</p>';
        });
}

// =======================
// Historial de máquina (detalle)
// =======================
function cargarMaquinaHistorialDetalle() {
    const idMaquina = getQueryParam('id');
    if (!idMaquina) return;
    fetch('data/maquinas-datos.json')
        .then(res => res.json())
        .then(maquinas => {
            const maquina = maquinas.find(m => m.id === idMaquina);
            const cont = document.getElementById('detalle-maquina-historial');
            if (!maquina) {
                cont.innerHTML = '<p>No se encontró la máquina.</p>';
                return;
            }

            // Render nombre, QR y tabs
            let html = `
                <h2>${maquina.nombre}</h2>
                ${maquina.qr ? `<img src="qr/${maquina.qr}" alt="QR" class="qr-img">` : ''}
            `;

            // Tabs de mantenimientos
            if (Array.isArray(maquina.mantenimientos) && maquina.mantenimientos.length > 0) {
                html += `<div id="tabs-mantenimientos-detalle">`;
                maquina.mantenimientos.forEach((mtto, idx) => {
                    html += `<button class="tab-mtto-detalle" data-idx="${idx}" ${idx === 0 ? "style='font-weight:bold'" : ""}>${mtto.fecha} - ${mtto.trabajo}</button>`;
                });
                html += `</div><section id="detalle-mantenimiento-detalle"></section>`;
            } else {
                html += `<p>No hay mantenimientos registrados para esta máquina.</p>`;
            }
            cont.innerHTML = html;

            // Mostrar detalle del mantenimiento (como tabs)
            if (Array.isArray(maquina.mantenimientos) && maquina.mantenimientos.length > 0) {
                function mostrarDetalle(idx) {
                    const mtto = maquina.mantenimientos[idx];
                    let detalleHtml = `
                        <h3>Mantenimiento del ${mtto.fecha}</h3>
                        <table>
                          <tr><td><strong>Trabajo:</strong> ${mtto.trabajo || ''}</td></tr>
                          <tr><td><strong>Empresa:</strong> ${mtto.empresa || ''}</td></tr>
                          <tr><td><strong>Contacto:</strong> ${mtto.contacto || ''}</td></tr>
                          <tr><td><strong>Ubicación:</strong> ${mtto.ubicacion || ''}</td></tr>
                          <tr><td><strong>Tel:</strong> ${mtto.tel || ''}</td></tr>
                          <tr><td><strong>Estado:</strong> ${mtto.estado || ''}</td></tr>
                          <tr><td><strong>Puesto:</strong> ${mtto.puesto || ''}</td></tr>
                          <tr><td><strong>Fecha de compra:</strong> ${mtto.fecha_compra || ''}</td></tr>
                          <tr><td><strong>Quién realiza:</strong> ${mtto.quien_realiza || ''}</td></tr>
                          <tr><td><strong>Fecha instalación:</strong> ${mtto.fecha_instalacion || ''}</td></tr>
                          <tr><td><strong>Modelo:</strong> ${mtto.modelo || ''}</td></tr>
                          <tr><td><strong>Tipo:</strong> ${mtto.tipo || ''}</td></tr>
                          <tr><td><strong>No. Serie:</strong> ${mtto.serie || ''}</td></tr>
                          <tr><td><strong>Temp. máx:</strong> ${mtto.temp_max || ''}</td></tr>
                          <tr><td><strong>Fase motor:</strong> ${mtto.fase || ''}</td></tr>
                          <tr><td><strong>Voltios:</strong> ${mtto.voltios || ''}</td></tr>
                          <tr><td><strong>Amperaje máx:</strong> ${mtto.amperaje || ''}</td></tr>
                        </table>
                        <h4>Lecturas</h4>
                        <table>
                          <tr><td><strong>Toma corriente:</strong> ${mtto.lecturas && mtto.lecturas.toma_corriente ? mtto.lecturas.toma_corriente : ''}</td></tr>
                          <tr><td><strong>Rampeo corriente:</strong> ${mtto.lecturas && mtto.lecturas.rampeo_corriente ? mtto.lecturas.rampeo_corriente : ''}</td></tr>
                          <tr><td><strong>Entrada:</strong> ${mtto.lecturas && mtto.lecturas.entrada ? mtto.lecturas.entrada : ''}</td></tr>
                          <tr><td><strong>Rampeo entrada:</strong> ${mtto.lecturas && mtto.lecturas.rampeo_entrada ? mtto.lecturas.rampeo_entrada : ''}</td></tr>
                          <tr><td><strong>Salida:</strong> ${mtto.lecturas && mtto.lecturas.salida ? mtto.lecturas.salida : ''}</td></tr>
                          <tr><td><strong>Rampeo salida:</strong> ${mtto.lecturas && mtto.lecturas.rampeo_salida ? mtto.lecturas.rampeo_salida : ''}</td></tr>
                          <tr><td><strong>Amperaje:</strong> ${mtto.lecturas && mtto.lecturas.amperaje ? mtto.lecturas.amperaje : ''}</td></tr>
                          <tr><td><strong>Rampeo amperaje:</strong> ${mtto.lecturas && mtto.lecturas.rampeo_amperaje ? mtto.lecturas.rampeo_amperaje : ''}</td></tr>
                          <tr><td><strong>Presión:</strong> ${mtto.lecturas && mtto.lecturas.presion ? mtto.lecturas.presion : ''}</td></tr>
                          <tr><td><strong>Rampeo presión:</strong> ${mtto.lecturas && mtto.lecturas.rampeo_presion ? mtto.lecturas.rampeo_presion : ''}</td></tr>
                          <tr><td><strong>Aceite:</strong> ${mtto.lecturas && mtto.lecturas.aceite ? mtto.lecturas.aceite : ''}</td></tr>
                          <tr><td><strong>Rampeo aceite:</strong> ${mtto.lecturas && mtto.lecturas.rampeo_aceite ? mtto.lecturas.rampeo_aceite : ''}</td></tr>
                          <tr><td><strong>Temperatura:</strong> ${mtto.lecturas && mtto.lecturas.temperatura ? mtto.lecturas.temperatura : ''}</td></tr>
                          <tr><td><strong>Rampeo temperatura:</strong> ${mtto.lecturas && mtto.lecturas.rampeo_temperatura ? mtto.lecturas.rampeo_temperatura : ''}</td></tr>
                        </table>
                        <h4>Material utilizado</h4>
                        <p>${mtto.material_utilizado || ''}</p>
                        <h4>Comentarios</h4>
                        <p>${mtto.comentarios || ''}</p>
                        <p><strong>Realizó:</strong> ${mtto.realizo || ''} &nbsp; <strong>Recibió:</strong> ${mtto.recibio || ''}</p>
                        <div class="acciones-historial">
                          <button onclick="window.print()">Imprimir historial</button>
                          <button onclick="window.location.href='maquinas-listado.html'">Volver al listado</button>
                        </div>
                    `;
                    document.getElementById('detalle-mantenimiento-detalle').innerHTML = detalleHtml;
                    // Resalta la pestaña activa
                    document.querySelectorAll('.tab-mtto-detalle').forEach((btn, i) => {
                        btn.style.fontWeight = i === idx ? 'bold' : 'normal';
                    });
                }
                // Asigna eventos
                document.querySelectorAll('.tab-mtto-detalle').forEach(tab => {
                    tab.onclick = () => mostrarDetalle(Number(tab.dataset.idx));
                });
                // Mostrar el primero por defecto
                mostrarDetalle(0);
            }
        })
        .catch(() => {
            document.getElementById('detalle-maquina-historial').innerHTML = '<p>Error al cargar el historial.</p>';
        });
}

// =======================
// Inicialización automática
// =======================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('maquinas-listado')) {
        cargarMaquinasListado();
    }
    if (document.getElementById('detalle-maquina-historial')) {
        cargarMaquinaHistorialDetalle();
    }
});
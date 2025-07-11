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
// Inicialización automática
// =======================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('maquinas-listado')) {
        cargarMaquinasListado();
    }
});

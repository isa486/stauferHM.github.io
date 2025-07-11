// Mostrar listado de máquinas
function cargarMaquinasListado() {
  fetch('data/maquinas.json')
    .then(res => res.json())
    .then(maquinas => {
      const lista = document.getElementById('maquinas-listado');
      lista.innerHTML = '';
      maquinas.forEach(maquina => {
        lista.innerHTML += `
          <div class="maquina-item">
            <h3>${maquina.nombre}</h3>
            <a href="maquina-historial-detalle.html?id=${maquina.id}">Ver historial</a>
            ${maquina.qr ? `<img src="qr/${maquina.qr}" alt="QR" class="qr-img">` : ''}
          </div>
        `;
      });
    });
}

// Mostrar historial de una máquina
function cargarMaquinaHistorialDetalle() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;
  fetch(`data/historiales/${id}.json`)
    .then(res => res.json())
    .then(historial => {
      const cont = document.getElementById('detalle-mantenimiento');
      cont.innerHTML = '';
      if (historial.length === 0) {
        cont.innerHTML = '<p>No hay mantenimientos registrados.</p>';
        return;
      }
      historial.forEach(mtto => {
        cont.innerHTML += `
          <h3>Mantenimiento del ${mtto.fecha}</h3>
          <p><strong>Trabajo:</strong> ${mtto.trabajo}</p>
          <p><strong>Empresa:</strong> ${mtto.empresa}</p>
          <p><strong>Ubicación:</strong> ${mtto.ubicacion}</p>
          <p><strong>Comentarios:</strong> ${mtto.comentarios}</p>
          <p><strong>Realizó:</strong> ${mtto.realizo} <strong>Recibió:</strong> ${mtto.recibio}</p>
          <hr>
        `;
      });
    });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('maquinas-listado')) {
    cargarMaquinasListado();
  }
  if (document.getElementById('detalle-mantenimiento')) {
    cargarMaquinaHistorialDetalle();
  }
});

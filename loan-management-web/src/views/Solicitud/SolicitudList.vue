<template>
  <div class="solicitud-list-container">
    <h2>Gestión de Solicitudes de Préstamo</h2>
    
    <div class="action-buttons-header">
      <router-link :to="{ name: 'solicitud-create' }" class="btn btn-primary create-btn">
        + Crear Nueva Solicitud
      </router-link>
    </div>

    <p v-if="message" :class="messageType">{{ message }}</p>

    <div v-if="solicitudes.length > 0">
      <table class="table">
        <thead>
          <tr>
            <th>ID Préstamo</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Plazo</th>
            <th>Tasa de Interés</th>
            <th>Fecha Sol.</th>
            <th>Estado</th>
            <th>Acciones</th>
            <th>Pagos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="solicitud in solicitudes" :key="getSolicitudId(solicitud)">
            <td>{{ getSolicitudId(solicitud) }}</td>
            <td>{{ getClienteNombre(solicitud.cliente?.clienteID || solicitud.cliente?.id || solicitud.clienteID || solicitud.clienteId) }}</td>
            <td>${{ formatCurrency(solicitud.montoSolicitado) }}</td>
            <td>{{ getPlazoMeses(solicitud.tipoPlazo?.plazoID || solicitud.tipoPlazo?.plazoId || solicitud.plazoID || solicitud.plazoId) }}</td>
            <td>{{ getTasaInteres(solicitud.tipoPlazo?.plazoID || solicitud.tipoPlazo?.plazoId || solicitud.plazoID || solicitud.plazoId) }}</td>
            <td>{{ formatDate(solicitud.fechaSolicitud) }}</td>
            <td><span :class="['status', (solicitud.estadoSolicitud?.nombreEstado || solicitud.estado || '').toLowerCase()]">{{ solicitud.estadoSolicitud?.nombreEstado || solicitud.estado || 'N/A' }}</span></td>
            
            <td class="action-buttons">
              <button 
                @click="openModal(getSolicitudId(solicitud), 'APROBAR')" 
                class="btn btn-sm btn-success"
                :disabled="!isEnProceso(solicitud)">
                Aprobar
              </button>
              <button 
                @click="openModal(getSolicitudId(solicitud), 'RECHAZAR')" 
                class="btn btn-sm btn-danger"
                :disabled="!isEnProceso(solicitud)">
                Rechazar
              </button>
              <template v-if="isSolicitudAprobada(solicitud)">
                <router-link 
                  :to="{ name: 'pago-create', params: { id: getPrestamoId(solicitud) } }" 
                  class="btn btn-sm btn-primary">
                  Registrar Pago
                </router-link>
              </template>
              <span v-else class="no-prestamo">-</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination-controls">
        <button 
          @click="loadSolicitudes(page - 1)" 
          :disabled="page <= 1" 
          class="btn btn-secondary">
          Anterior
        </button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button 
          @click="loadSolicitudes(page + 1)" 
          :disabled="page >= totalPages" 
          class="btn btn-secondary">
          Siguiente
        </button>
      </div>

    </div>
    <div v-else-if="!isLoading" class="no-data">
        <p>No hay solicitudes para mostrar.</p>
    </div>
    <div v-else class="loading">
        Cargando datos...
    </div>

    <div v-if="showModal" class="modal-backdrop">
        <div class="modal">
            <h3>{{ modalAction === 'APROBAR' ? 'Aprobar' : 'Rechazar' }} Solicitud ID: {{ selectedSolicitudId || 'N/A' }}</h3>
            <p>Ingrese los detalles de la gestión:</p>
            <textarea v-model="gestionDetalles" rows="3" required></textarea>
            
            <div class="modal-actions">
                <button @click="submitGestion" :class="['btn', modalAction === 'APROBAR' ? 'btn-success' : 'btn-danger']">
                    Confirmar {{ modalAction }}
                </button>
                <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import ClienteService from '@/services/ClienteService';
import PlazoService from '@/services/PlazoService';

// --- Variables Reactivas ---
const solicitudes = ref([]);
const page = ref(1); // Página actual (1-based, como tu backend)
const size = ref(10); // Tamaño de la página
const totalPages = ref(1);
const isLoading = ref(false);

const message = ref('');
const messageType = ref('');

// Cache de clientes y plazos para evitar múltiples llamadas
const clientesCache = ref({});
const plazosCache = ref({});
const isLoadingClientes = ref(false);
const isLoadingPlazos = ref(false);

// Variables para el Modal de Gestión
const showModal = ref(false);
const selectedSolicitudId = ref(null);
const modalAction = ref(''); // 'APROBAR' o 'RECHAZAR'
const gestionDetalles = ref('');

// --- Métodos de Listado y Paginación ---
async function loadSolicitudes(newPage = 1) {
  isLoading.value = true;
  page.value = newPage;
  message.value = ''; // Limpia mensajes al cambiar de página
  try {
    const response = await SolicitudService.getAllSolicitudes(page.value, size.value);
    
    // Manejar diferentes estructuras de respuesta
    let solicitudesData = [];
    if (response && response.data) {
      // Si la respuesta tiene estructura de paginación (Spring Data)
      if (response.data.content) {
        solicitudesData = response.data.content || [];
        totalPages.value = response.data.totalPages || 1;
      } 
      // Si la respuesta es un array directo
      else if (Array.isArray(response.data)) {
        solicitudesData = response.data;
        totalPages.value = 1;
      }
      // Si no hay datos
      else {
        solicitudesData = [];
        totalPages.value = 1;
      }
    } else {
      solicitudesData = [];
      totalPages.value = 1;
    }
    
    solicitudes.value = solicitudesData;
    
    // Cargar datos faltantes de clientes y plazos
    await loadMissingData(solicitudesData);
    
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
    console.error("Detalles del error:", error.response || error.message);
    
    // Asegurar que siempre se muestre el estado correcto
    solicitudes.value = [];
    totalPages.value = 1;
    
    // Mostrar mensaje de error más específico
    let errorMessage = 'Error al cargar la lista de solicitudes.';
    if (error.response) {
      errorMessage += ` (${error.response.status}: ${error.response.statusText})`;
    } else if (error.message) {
      errorMessage += ` (${error.message})`;
    }
    showMessage(errorMessage, 'error');
  } finally {
    // Asegurar que siempre se desactive el estado de carga
    isLoading.value = false;
  }
}

// Cargar datos faltantes de clientes y plazos
async function loadMissingData(solicitudesData) {
  const clientesIds = new Set();
  const plazosIds = new Set();
  
  // Recopilar IDs únicos
  solicitudesData.forEach(solicitud => {
    const clienteId = solicitud.clienteID || solicitud.clienteId;
    const plazoId = solicitud.plazoID || solicitud.plazoId;
    
    if (clienteId && !clientesCache.value[clienteId]) {
      clientesIds.add(clienteId);
    }
    
    if (plazoId && !plazosCache.value[plazoId]) {
      plazosIds.add(plazoId);
    }
  });
  
  // Cargar clientes faltantes en paralelo
  const clientesPromises = Array.from(clientesIds).map(id => loadClienteById(id));
  const plazosPromises = Array.from(plazosIds).map(id => loadPlazoById(id));
  
  await Promise.all([...clientesPromises, ...plazosPromises]);
}

// --- Métodos de Utilidad para obtener IDs ---
function getSolicitudId(solicitud) {
  // Intentar diferentes posibles ubicaciones del ID
  const id = solicitud.solicitudID;
  
  // Log para debuggear (puedes removerlo después)
  if (!id && solicitud) {
    console.warn('No se encontró ID en la solicitud. Estructura:', Object.keys(solicitud));
  }
  
  return id;
}

function getPrestamoId(solicitud) {
  // Intentar diferentes posibles ubicaciones del ID del préstamo
  // Si la solicitud está aprobada, el préstamo puede tener su propio ID
  return solicitud.prestamo?.prestamoID ||
         solicitud.prestamo?.prestamoId ||
         solicitud.prestamo?.id ||
         solicitud.prestamoID ||
         solicitud.prestamoId ||
         // Si no hay préstamo separado, usar el ID de la solicitud (asumiendo que es el mismo)
         getSolicitudId(solicitud);
}

function isEnProceso(solicitud) {
  const estado = (solicitud.estadoSolicitud?.nombreEstado || solicitud.estado || '').toUpperCase();
  return estado === 'EN PROCESO';
}

function isSolicitudAprobada(solicitud) {
  const estado = (solicitud.estadoSolicitud?.nombreEstado || solicitud.estado || '').toUpperCase();
  return estado === 'APROBADO' || estado === 'APROBADA';
}

// --- Métodos del Modal ---
function openModal(id, action) {
    if (!id) {
        console.error('ID de solicitud no válido:', id);
        showMessage('Error: No se pudo obtener el ID de la solicitud.', 'error');
        return;
    }
    
    selectedSolicitudId.value = id;
    modalAction.value = action;
    gestionDetalles.value = ''; // Limpiar detalles anteriores
    showModal.value = true;
}

function closeModal() {
    showModal.value = false;
}

// --- Métodos de Aprobación/Rechazo ---
async function submitGestion() {
    if (!gestionDetalles.value.trim()) {
        alert("Los detalles de la gestión son obligatorios.");
        return;
    }

    try {
        const id = selectedSolicitudId.value;
        
        if (!id) {
            showMessage('Error: No se pudo obtener el ID de la solicitud.', 'error');
            console.error('ID de solicitud no válido:', id);
            return;
        }
        
        const data = { detalles: gestionDetalles.value.trim() };
        
        
        if (modalAction.value === 'APROBAR') {
            // Llama a PUT /api/solicitudes/prestamo-id/{id}/aprobar
            await SolicitudService.aprobarSolicitud(id, data);
            showMessage(`Solicitud ID ${id} APROBADA y Préstamo CREADO.`, 'success');
        } else {
            // Llama a PUT /api/solicitudes/prestamo-id/{id}/rechazar
            await SolicitudService.rechazarSolicitud(id, data);
            showMessage(`Solicitud ID ${id} RECHAZADA.`, 'success');
        }
        
        closeModal();
        // Recargar la lista para ver el estado actualizado
        // Si la página actual queda vacía, recarga la página anterior (máx 1)
        setTimeout(() => {
            if (solicitudes.value.length === 1 && page.value > 1) {
                loadSolicitudes(page.value - 1);
            } else {
                loadSolicitudes(page.value);
            }
        }, 500);

    } catch (error) {
        console.error("Error al gestionar solicitud:", error.response || error);
        showMessage('Error al gestionar. Estado inválido o recurso no encontrado.', 'error');
    }
}

// --- Métodos de Utilidad ---
function formatCurrency(value) {
  if (!value && value !== 0) return '0.00';
  return parseFloat(value).toFixed(2);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'N/A';
  }
}

function showMessage(msg, type) {
    message.value = msg;
    messageType.value = type;
    setTimeout(() => { message.value = ''; }, 5000);
}

// --- Cargar datos de referencia (Clientes y Plazos) ---
async function loadClientes() {
  if (isLoadingClientes.value || Object.keys(clientesCache.value).length > 0) return;
  
  isLoadingClientes.value = true;
  try {
    // Cargar todos los clientes (usando un tamaño grande)
    const response = await ClienteService.getAllClientes(1, 1000);
    const clientes = response.data.content || [];
    
    // Crear un mapa de ID -> nombre completo
    clientes.forEach(cliente => {
      const id = cliente.clienteID || cliente.id;
      clientesCache.value[id] = {
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || ''
      };
    });
  } catch (error) {
    console.error("Error al cargar clientes:", error);
  } finally {
    isLoadingClientes.value = false;
  }
}

async function loadPlazos() {
  if (isLoadingPlazos.value || Object.keys(plazosCache.value).length > 0) return;
  
  isLoadingPlazos.value = true;
  try {
    const response = await PlazoService.getAllPlazos();
    const plazos = Array.isArray(response.data) ? response.data : (response.data.content || response.data || []);
    
    // Crear un mapa de ID -> información del plazo
    plazos.forEach(plazo => {
      const id = plazo.plazoID || plazo.id;
      plazosCache.value[id] = {
        meses: plazo.duracionMeses || plazo.duracion || plazo.meses || plazo.plazoID || plazo.id,
        tasaInteres: plazo.tasaInteres || plazo.tasa || plazo.interes || 0
      };
    });
  } catch (error) {
    console.error("Error al cargar plazos:", error);
  } finally {
    isLoadingPlazos.value = false;
  }
}

// --- Métodos de Utilidad para obtener información ---
function getClienteNombre(clienteId) {
  if (!clienteId) return 'N/A';
  
  const cliente = clientesCache.value[clienteId];
  if (cliente) {
    return `${cliente.nombre} ${cliente.apellido}`.trim() || `Cliente ID: ${clienteId}`;
  }
  
  // Si no está en cache, intentar cargarlo
  if (!isLoadingClientes.value) {
    loadClienteById(clienteId);
  }
  
  return `Cliente ID: ${clienteId}`;
}

async function loadClienteById(id) {
  try {
    const response = await ClienteService.getClienteById(id);
    const cliente = response.data;
    clientesCache.value[id] = {
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || ''
    };
  } catch (error) {
    console.error(`Error al cargar cliente ${id}:`, error);
  }
}

function getPlazoMeses(plazoId) {
  if (!plazoId) return 'N/A';
  
  const plazo = plazosCache.value[plazoId];
  if (plazo) {
    return `${plazo.meses} meses`;
  }
  
  // Si no está en cache, intentar cargarlo
  if (!isLoadingPlazos.value) {
    loadPlazoById(plazoId);
  }
  
  return `Plazo ID: ${plazoId}`;
}

async function loadPlazoById(id) {
  try {
    const response = await PlazoService.getPlazoById(id);
    const plazo = response.data;
    plazosCache.value[id] = {
      meses: plazo.duracionMeses || plazo.duracion || plazo.meses || plazo.plazoID || plazo.id,
      tasaInteres: plazo.tasaInteres || plazo.tasa || plazo.interes || 0
    };
  } catch (error) {
    console.error(`Error al cargar plazo ${id}:`, error);
  }
}

function getTasaInteres(plazoId) {
  if (!plazoId) return 'N/A';
  
  const plazo = plazosCache.value[plazoId];
  if (plazo && plazo.tasaInteres) {
    return `${plazo.tasaInteres}%`;
  }
  
  return 'N/A';
}

// --- Ciclo de Vida ---
onMounted(async () => {
  // Cargar datos de referencia primero
  await Promise.all([loadClientes(), loadPlazos()]);
  // Luego cargar las solicitudes
  loadSolicitudes();
});
</script>

<style scoped>
/* Estilos Específicos */
.solicitud-list-container {
  padding: 20px;
}

h2 {
    color: #004a8b;
    margin-bottom: 20px;
}

.action-buttons-header {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.create-btn {
    margin-bottom: 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.table th, .table td {
  border: 1px solid #ddd;
  padding: 10px 15px;
  text-align: left;
}

.table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.pagos-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
}

.no-prestamo {
    color: #999;
    font-style: italic;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

.btn {
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    font-size: 0.9em;
    border: none;
}

.btn-primary {
    background-color: #004a8b;
    color: white;
}
.btn-primary:hover {
    background-color: #00376b;
}

.btn-success {
    background-color: #28a745;
    color: white;
}
.btn-success:hover {
    background-color: #218838;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}
.btn-danger:hover {
    background-color: #c82333;
}

.pagination-controls {
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}
.btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.success {
    color: green;
    font-weight: bold;
    margin-top: 10px;
}

.error {
    color: red;
    font-weight: bold;
    margin-top: 10px;
}

.no-data, .loading {
    text-align: center;
    margin-top: 50px;
    font-size: 1.1em;
    color: #666;
}

/* Estilos Específicos para Estados de Solicitudes */
.status {
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 0.85em;
}

/* Colores de Estado (basados en tu API) */
.pendiente {
    background-color: #ffc10740; /* Amarillo claro */
    color: #9a6600;
}
.aprobado {
    background-color: #28a74540; /* Verde claro */
    color: #1a6e38;
}
.rechazado {
    background-color: #dc354540; /* Rojo claro */
    color: #8c2a38;
}

/* Estilos para el Modal */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal textarea {
    width: 100%;
    margin-top: 10px;
    padding: 10px;
    box-sizing: border-box;
    resize: vertical;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.modal-actions {
    margin-top: 15px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
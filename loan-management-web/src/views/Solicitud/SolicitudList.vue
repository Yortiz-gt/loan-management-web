<template>
  <div class="solicitud-list-container">
    <h2>Gestión de Solicitudes de Préstamo</h2>
    
    <router-link :to="{ name: 'solicitud-create' }" class="btn btn-primary create-btn">
      + Crear Nueva Solicitud
    </router-link>

    <p v-if="message" :class="messageType">{{ message }}</p>

    <div v-if="solicitudes.length > 0">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente ID</th>
            <th>Monto</th>
            <th>Plazo</th>
            <th>Fecha Sol.</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="solicitud in solicitudes" :key="solicitud.solicitudPrestamoID || solicitud.id">
            <td>{{ solicitud.solicitudPrestamoID || solicitud.id }}</td>
            <td>{{ solicitud.clienteID || solicitud.clienteId }}</td>
            <td>${{ formatCurrency(solicitud.montoSolicitado) }}</td>
            <td>{{ solicitud.plazoID || solicitud.plazoId }}</td>
            <td>{{ formatDate(solicitud.fechaSolicitud) }}</td>
            <td><span :class="['status', (solicitud.estado || '').toLowerCase()]">{{ solicitud.estado || 'N/A' }}</span></td>
            
            <td class="action-buttons">
              <template v-if="(solicitud.estado || '').toUpperCase() === 'PENDIENTE'">
                <button @click="openModal(solicitud.solicitudPrestamoID || solicitud.id, 'APROBAR')" class="btn btn-sm btn-success">Aprobar</button>
                <button @click="openModal(solicitud.solicitudPrestamoID || solicitud.id, 'RECHAZAR')" class="btn btn-sm btn-danger">Rechazar</button>
              </template>
              <span v-else>Gestionada</span>
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
            <h3>{{ modalAction === 'APROBAR' ? 'Aprobar' : 'Rechazar' }} Solicitud ID: {{ selectedSolicitudId }}</h3>
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

// --- Variables Reactivas ---
const solicitudes = ref([]);
const page = ref(1); // Página actual (1-based, como tu backend)
const size = ref(10); // Tamaño de la página
const totalPages = ref(1);
const isLoading = ref(false);

const message = ref('');
const messageType = ref('');

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
    if (response && response.data) {
      // Si la respuesta tiene estructura de paginación (Spring Data)
      if (response.data.content) {
        solicitudes.value = response.data.content || [];
        totalPages.value = response.data.totalPages || 1;
      } 
      // Si la respuesta es un array directo
      else if (Array.isArray(response.data)) {
        solicitudes.value = response.data;
        totalPages.value = 1;
      }
      // Si no hay datos
      else {
        solicitudes.value = [];
        totalPages.value = 1;
      }
    } else {
      solicitudes.value = [];
      totalPages.value = 1;
    }
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

// --- Métodos del Modal ---
function openModal(id, action) {
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
        if (solicitudes.value.length === 1 && page.value > 1) {
            loadSolicitudes(page.value - 1);
        } else {
            loadSolicitudes(page.value);
        }

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

// --- Ciclo de Vida ---
onMounted(() => {
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

.create-btn {
    margin-bottom: 20px;
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
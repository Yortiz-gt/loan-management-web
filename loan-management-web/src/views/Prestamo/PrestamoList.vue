<template>
  <div class="prestamo-list-container">
    <h2>Gestión de Préstamos</h2>

    <p v-if="message" :class="messageType">{{ message }}</p>

    <div v-if="prestamos.length > 0">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente ID</th>
            <th>Monto Total</th>
            <th>Monto Pagado</th>
            <th>Saldo Pendiente</th>
            <th>Plazo</th>
            <th>Fecha Aprobación</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prestamo in prestamos" :key="prestamo.prestamoID || prestamo.id">
            <td>{{ prestamo.prestamoID || prestamo.id }}</td>
            <td>{{ prestamo.clienteID || prestamo.clienteId }}</td>
            <td>${{ formatCurrency(prestamo.montoTotal) }}</td>
            <td>${{ formatCurrency(prestamo.montoPagado || 0) }}</td>
            <td>${{ formatCurrency(calculateSaldo(prestamo)) }}</td>
            <td>{{ prestamo.plazoID || prestamo.plazoId || 'N/A' }} meses</td>
            <td>{{ formatDate(prestamo.fechaAprobacion) }}</td>
            <td><span :class="['status', getEstadoClass(prestamo)]">{{ getEstado(prestamo) }}</span></td>
            <td class="action-buttons">
              <router-link 
                :to="{ name: 'pago-create', params: { id: prestamo.prestamoID || prestamo.id } }" 
                class="btn btn-sm btn-primary"
                v-if="calculateSaldo(prestamo) > 0">
                Registrar Pago
              </router-link>
              <span v-else class="completado">Completado</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination-controls">
        <button 
          @click="loadPrestamos(page - 1)" 
          :disabled="page <= 1" 
          class="btn btn-secondary">
          Anterior
        </button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button 
          @click="loadPrestamos(page + 1)" 
          :disabled="page >= totalPages" 
          class="btn btn-secondary">
          Siguiente
        </button>
      </div>

    </div>
    <div v-else-if="!isLoading" class="no-data">
        <p>No hay préstamos registrados en el sistema.</p>
    </div>
    <div v-else class="loading">
        Cargando datos...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PrestamoService from '@/services/PrestamoService';

// --- Variables Reactivas ---
const prestamos = ref([]);
const page = ref(1); // Página actual (1-based, como tu backend)
const size = ref(10); // Tamaño de la página
const totalPages = ref(1);
const isLoading = ref(false);

const message = ref('');
const messageType = ref('');

// --- Métodos de Listado y Paginación ---
async function loadPrestamos(newPage = 1) {
  isLoading.value = true;
  page.value = newPage;
  message.value = ''; // Limpia mensajes al cambiar de página

  try {
    // Llama al endpoint GET /api/prestamos?page={page}&size={size}
    const response = await PrestamoService.getAllPrestamos(page.value, size.value);
    
    // Manejar diferentes estructuras de respuesta
    if (response && response.data) {
      // Si la respuesta tiene estructura de paginación (Spring Data)
      if (response.data.content) {
        prestamos.value = response.data.content || [];
        totalPages.value = response.data.totalPages || 1;
      } 
      // Si la respuesta es un array directo
      else if (Array.isArray(response.data)) {
        prestamos.value = response.data;
        totalPages.value = 1;
      }
      // Si no hay datos
      else {
        prestamos.value = [];
        totalPages.value = 1;
      }
    } else {
      prestamos.value = [];
      totalPages.value = 1;
    }

  } catch (error) {
    console.error("Error al cargar préstamos:", error);
    console.error("Detalles del error:", error.response || error.message);
    
    // Asegurar que siempre se muestre el estado correcto
    prestamos.value = [];
    totalPages.value = 1;
    
    // Mostrar mensaje de error más específico
    let errorMessage = 'Error al cargar la lista de préstamos.';
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

function calculateSaldo(prestamo) {
  const montoTotal = parseFloat(prestamo.montoTotal || 0);
  const montoPagado = parseFloat(prestamo.montoPagado || 0);
  return Math.max(0, montoTotal - montoPagado);
}

function getEstado(prestamo) {
  const saldo = calculateSaldo(prestamo);
  if (saldo <= 0) return 'PAGADO';
  return 'PENDIENTE';
}

function getEstadoClass(prestamo) {
  const saldo = calculateSaldo(prestamo);
  if (saldo <= 0) return 'pagado';
  return 'pendiente';
}

function showMessage(msg, type) {
    message.value = msg;
    messageType.value = type;
    // Opcional: Ocultar el mensaje después de 5 segundos
    setTimeout(() => { message.value = ''; }, 5000);
}

// --- Ciclo de Vida: Carga Inicial ---
onMounted(() => {
  loadPrestamos();
});
</script>

<style scoped>
/* Estilos Específicos */
.prestamo-list-container {
  padding: 20px;
}

h2 {
    color: #004a8b;
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
    align-items: center;
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

.completado {
    color: #28a745;
    font-weight: bold;
    font-size: 0.9em;
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

/* Estilos Específicos para Estados de Préstamos */
.status {
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 0.85em;
}

.pendiente {
    background-color: #ffc10740; /* Amarillo claro */
    color: #9a6600;
}

.pagado {
    background-color: #28a74540; /* Verde claro */
    color: #1a6e38;
}
</style>

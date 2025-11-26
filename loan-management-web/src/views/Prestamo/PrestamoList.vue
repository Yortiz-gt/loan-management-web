<template>
  <div class="prestamo-list-container">
    <h2>Gestión de Préstamos</h2>

    <p v-if="message" :class="messageType">{{ message }}</p>

    <div v-if="prestamos.length > 0">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Monto Prestamo</th>
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
            <td>{{ getClienteNombre(prestamo.cliente?.clienteID || prestamo.cliente?.id || prestamo.clienteID || prestamo.clienteId) }}</td>
            <td>${{ formatCurrency(calculateSaldo(prestamo)) }}</td>
            <td>${{ formatCurrency(prestamo.montoPendiente) }}</td>
            <td>{{ getPlazoMeses(prestamo.solicitud.tipoPlazo?.plazoID || prestamo.tipoPlazo?.plazoId || prestamo.plazoID || prestamo.plazoId) }}</td>
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
import ClienteService from '@/services/ClienteService';
import PlazoService from '@/services/PlazoService';

// --- Variables Reactivas ---
const prestamos = ref([]);
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

    // Cargar datos faltantes de clientes y plazos
    await loadMissingData(prestamos.value);

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
  const montoPricipal = parseFloat(prestamo.montoPrincipal || 0);
  const tasaInteres= parseFloat(prestamo.tasaInteres);
  const plazo         = prestamo.plazoMeses;
  prestamo.montoPrincipal + (prestamo.montoPrincipal * prestamo.plazoMeses * prestamo.tasaInteres)
  console.log( montoPricipal +  (montoPricipal*plazo*tasaInteres));
  return Math.max(0, montoPricipal +  (montoPricipal*plazo*tasaInteres));
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

// --- Cargar datos de referencia (Clientes) ---
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

// Cargar datos faltantes de clientes y plazos
async function loadMissingData(prestamosData) {
  const clientesIds = new Set();
  const plazosIds = new Set();

  // Recopilar IDs únicos
  prestamosData.forEach(prestamo => {
    const clienteId = prestamo.cliente?.clienteID || prestamo.cliente?.id || prestamo.clienteID || prestamo.clienteId;
    const plazoId = prestamo.tipoPlazo?.plazoID || prestamo.tipoPlazo?.plazoId || prestamo.plazoID || prestamo.plazoId;

    if (clienteId && !clientesCache.value[clienteId]) {
      clientesIds.add(clienteId);
    }

    if (plazoId && !plazosCache.value[plazoId]) {
      plazosIds.add(plazoId);
    }
  });

  // Cargar datos faltantes en paralelo
  const clientesPromises = Array.from(clientesIds).map(id => loadClienteById(id));
  const plazosPromises = Array.from(plazosIds).map(id => loadPlazoById(id));
  await Promise.all([...clientesPromises, ...plazosPromises]);
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

// --- Cargar datos de referencia (Plazos) ---
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
        meses: plazo.meses || plazo.duracion || plazo.meses || plazo.plazoID || plazo.id,
        tasaInteres: plazo.tasaInteres || plazo.tasa || plazo.interes || 0
      };
    });
  } catch (error) {
    console.error("Error al cargar plazos:", error);
  } finally {
    isLoadingPlazos.value = false;
  }
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

// --- Métodos de Utilidad para obtener información del cliente ---
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

// --- Métodos de Utilidad para obtener información del plazo ---
function getPlazoMeses(plazoId) {
  console.log(plazoId);
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

// --- Ciclo de Vida: Carga Inicial ---
onMounted(async () => {
  // Cargar datos de referencia primero
  await Promise.all([loadClientes(), loadPlazos()]);
  // Luego cargar los préstamos
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

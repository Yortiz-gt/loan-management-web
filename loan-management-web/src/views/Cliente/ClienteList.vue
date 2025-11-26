<template>
  <div class="clientes-list-container">
    <h2>Gestión de Clientes</h2>
    
    <router-link :to="{ name: 'cliente-create' }" class="btn btn-primary create-btn">
      + Agregar Nuevo Cliente
    </router-link>

    <p v-if="message" :class="messageType">{{ message }}</p>

    <div v-if="clientes.length > 0">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre Completo</th>
            <th>Identificación</th>
            <th>Correo Electrónico</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cliente in clientes" :key="cliente.clienteID">
            <td>{{ cliente.clienteID }}</td>
            <td>{{ cliente.nombre }} {{ cliente.apellido }}</td>
            <td>{{ cliente.numeroIdentificacion }}</td>
            <td>{{ cliente.correoElectronico }}</td>
            <td>{{ cliente.telefono }}</td>
            <td class="action-buttons">
              <router-link :to="{ name: 'cliente-edit', params: { id: cliente.clienteID } }" class="btn btn-sm btn-edit">
                Editar
              </router-link>
              <button @click="confirmDelete(cliente.clienteID, cliente.nombre)" class="btn btn-sm btn-delete">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination-controls">
        <button 
          @click="loadClientes(page - 1)" 
          :disabled="page <= 1" 
          class="btn btn-secondary">
          Anterior
        </button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button 
          @click="loadClientes(page + 1)" 
          :disabled="page >= totalPages" 
          class="btn btn-secondary">
          Siguiente
        </button>
      </div>

    </div>
    <div v-else-if="!isLoading" class="no-data">
        <p>No hay clientes registrados en el sistema.</p>
    </div>
    <div v-else class="loading">
        Cargando datos...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ClienteService from '@/services/ClienteService'; // Importamos el servicio

// --- Variables Reactivas ---
const clientes = ref([]);
const page = ref(1); // Página actual (1-based, como tu backend)
const size = ref(10); // Tamaño de la página
const totalPages = ref(1);
const isLoading = ref(false);

const message = ref('');
const messageType = ref('');

// --- Métodos de Listado y Paginación ---
async function loadClientes(newPage = 1) {
  isLoading.value = true;
  page.value = newPage;
  message.value = ''; // Limpia mensajes al cambiar de página

  try {
    // Llama al endpoint GET /api/clientes?page={page}&size={size}
    const response = await ClienteService.getAllClientes(page.value, size.value);
    
    // Asume que el backend devuelve la estructura de Page<T> (Spring Data)
    clientes.value = response.data.content; 
    totalPages.value = response.data.totalPages;

  } catch (error) {
    console.error("Error al cargar clientes:", error);
    showMessage('Error al cargar la lista de clientes.', 'error');
  } finally {
    isLoading.value = false;
  }
}

// --- Métodos de Eliminación ---
function confirmDelete(id, name) {
  // Pide confirmación ya que la eliminación es en cascada (solicitudes/préstamos)
  if (confirm(`¿Estás seguro de que deseas eliminar al cliente ${name} (ID: ${id})? Esta acción eliminará todas sus solicitudes y es IRREVERSIBLE.`)) {
    deleteCliente(id);
  }
}

async function deleteCliente(id) {
  try {
    // Llama al endpoint DELETE /api/clientes/id-cliente/{id}
    await ClienteService.deleteCliente(id); 
    
    showMessage(`Cliente ID: ${id} eliminado exitosamente.`, 'success');
    
    // Recarga la lista para reflejar el cambio. 
    // Si la página actual queda vacía, recarga la página anterior (máx 1)
    if (clientes.value.length === 1 && page.value > 1) {
        loadClientes(page.value - 1);
    } else {
        loadClientes(page.value); 
    }

  } catch (error) {
    console.error("Error al eliminar cliente:", error.response || error);
    showMessage('Error al intentar eliminar el cliente. Verifique la consola.', 'error');
  }
}

function showMessage(msg, type) {
    message.value = msg;
    messageType.value = type;
    // Opcional: Ocultar el mensaje después de 5 segundos
    setTimeout(() => { message.value = ''; }, 5000);
}

// --- Ciclo de Vida: Carga Inicial ---
onMounted(() => {
  loadClientes();
});
</script>

<style scoped>
/* Estilos Específicos */
.clientes-list-container {
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
}

.btn-primary {
    background-color: #004a8b;
    color: white;
}
.btn-primary:hover {
    background-color: #00376b;
}

.btn-edit {
    background-color: #ffc107;
    color: #333;
}
.btn-delete {
    background-color: #dc3545;
    color: white;
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
</style>
<template>
  <div class="solicitud-form-container">
    <h2>Solicitar Nuevo Préstamo</h2>

    <form @submit.prevent="submitSolicitud" class="solicitud-form">
      
      <div class="form-group full-width">
        <label for="clienteID">Cliente Solicitante:</label>
        <div class="select-with-action">
          <select id="clienteID" v-model.number="solicitudData.clienteID" required>
            <option disabled value="">Seleccione un Cliente</option>
            <option v-for="cliente in clientes" :key="cliente.clienteID" :value="cliente.clienteID">
              {{ cliente.nombre }} {{ cliente.apellido }} (ID: {{ cliente.clienteID }})
            </option>
          </select>
          <router-link :to="{ name: 'cliente-create' }" class="btn-link-new">
            + Crear Nuevo Cliente
          </router-link>
        </div>
      </div>

      <div class="form-group">
        <label for="monto">Monto Solicitado:</label>
        <input type="number" id="monto" v-model.number="solicitudData.montoSolicitado" 
               step="0.01" min="0" required>
      </div>

      <div class="form-group">
        <label for="plazoID">Plazo Deseado:</label>
        <select id="plazoID" v-model.number="solicitudData.plazoID" required>
          <option disabled value="">Seleccione un Plazo</option>
          <option v-for="plazo in plazos" :key="plazo.plazoID || plazo.id" :value="plazo.plazoID || plazo.id">
            {{ plazo.duracionMeses || plazo.duracion || plazo.meses || plazo.plazoID || plazo.id }} Meses
          </option>
        </select>
      </div>
      
      <div class="form-actions full-width">
        <button type="submit" class="btn-primary">
          Enviar Solicitud
        </button>
        <button type="button" @click="goBack" class="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
    
    <p v-if="message" :class="messageType">{{ message }}</p>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SolicitudService from '@/services/SolicitudService';
import ClienteService from '@/services/ClienteService';
import PlazoService from '@/services/PlazoService';

const router = useRouter(); 

// Objeto reactivo para enlazar a los inputs del formulario
const solicitudData = ref({
  clienteID: null,
  montoSolicitado: null,
  plazoID: null, 
});

// Listas de opciones
const clientes = ref([]);
const plazos = ref([]);
const isLoadingClientes = ref(false);
const isLoadingPlazos = ref(false);

// Variables para mensajes
const message = ref('');
const messageType = ref('');

// Cargar datos al montar el componente
onMounted(() => {
  loadClientes();
  loadPlazos();
});

// Cargar todos los clientes (sin paginación para el select)
async function loadClientes() {
  isLoadingClientes.value = true;
  try {
    // Cargar todos los clientes, usando un tamaño grande para obtener todos
    const response = await ClienteService.getAllClientes(1, 1000);
    clientes.value = response.data.content;
  } catch (error) {
    console.error("Error al cargar clientes:", error);
    showMessage('Error al cargar la lista de clientes.', 'error');
  } finally {
    isLoadingClientes.value = false;
  }
}

// Cargar todos los plazos disponibles
async function loadPlazos() {
  isLoadingPlazos.value = true;
  try {
    const response = await PlazoService.getAllPlazos();
    // Si la respuesta es un array, usarlo directamente
    // Si es un objeto con content (paginación), usar content
    let plazosData = Array.isArray(response.data) ? response.data : (response.data.content || response.data || []);
    plazos.value = plazosData;
  } catch (error) {
    console.error("Error al cargar plazos:", error);
    showMessage('Error al cargar la lista de plazos disponibles.', 'error');
  } finally {
    isLoadingPlazos.value = false;
  }
}

// Lógica de envío de formulario
async function submitSolicitud() {
  message.value = ''; // Limpiar mensajes anteriores
  
  // Validación básica
  if (!solicitudData.value.clienteID || !solicitudData.value.montoSolicitado || !solicitudData.value.plazoID) {
    showMessage('Por favor, complete todos los campos.', 'error');
    return;
  }

  // Validar que el monto sea positivo
  if (solicitudData.value.montoSolicitado <= 0) {
    showMessage('El monto solicitado debe ser mayor a cero.', 'error');
    return;
  }

  try {
    // Llama al endpoint POST /api/solicitudes
    const response = await SolicitudService.createSolicitud(solicitudData.value);
    showMessage('Solicitud enviada exitosamente. Será revisada pronto.', 'success');
    
    // Limpiar formulario después del éxito
    solicitudData.value = { clienteID: null, montoSolicitado: null, plazoID: null };
    
    // Redirigir a la lista de solicitudes después de crear
    setTimeout(() => {
      router.push({ name: 'solicitud-list' });
    }, 1500);

  } catch (error) {
    console.error("Error en la operación:", error.response || error);
    let errorMessage = "Ocurrió un error desconocido al enviar la solicitud.";

    // Manejo de errores específicos del backend
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || 'Error en la validación de datos.';
    }
    showMessage(errorMessage, 'error');
  }
}

function showMessage(msg, type) {
  message.value = msg;
  messageType.value = type;
}

function goBack() {
  router.push({ name: 'solicitud-list' });
}

</script>

<style scoped>
/* Estilos consistentes con ClienteForm.vue */
.solicitud-form-container {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.solicitud-form {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.form-group {
  flex: 1 1 calc(50% - 20px); /* Ocupa la mitad del espacio menos el gap */
  display: flex;
  flex-direction: column;
}

.full-width {
    flex: 1 1 100%; /* Ocupa todo el ancho */
}

label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

input, select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; /* Asegura que el padding no cambie el ancho total */
}

.select-with-action {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.select-with-action select {
  flex: 1;
}

.btn-link-new {
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9em;
  white-space: nowrap;
  transition: background-color 0.3s;
}

.btn-link-new:hover {
  background-color: #218838;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  background-color: #004a8b; /* Azul del CHN */
}

.btn-secondary {
  background-color: #6c757d;
}

.btn-primary, .btn-secondary {
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-primary:hover {
    background-color: #00376b;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

.success {
    color: green;
    font-weight: bold;
    margin-top: 15px;
}

.error {
    color: red;
    font-weight: bold;
    margin-top: 15px;
}
</style>

<template>
  <div class="cliente-form-container">
    <h2>{{ isEditMode ? 'Editar Cliente' : 'Agregar Nuevo Cliente' }}</h2>

    <form @submit.prevent="saveClient" class="cliente-form">
      
      <div class="form-group">
        <label for="nombre">Nombre:</label>
        <input type="text" id="nombre" v-model="clientData.nombre" required>
      </div>
      <div class="form-group">
        <label for="apellido">Apellido:</label>
        <input type="text" id="apellido" v-model="clientData.apellido" required>
      </div>

      <div class="form-group">
        <label for="identificacion">No. Identificación:</label>
        <input type="text" id="identificacion" v-model="clientData.numeroIdentificacion" required>
      </div>
      <div class="form-group">
        <label for="fechaNacimiento">Fecha de Nacimiento:</label>
        <input type="date" id="fechaNacimiento" v-model="clientData.fechaNacimiento" required>
      </div>

      <div class="form-group full-width">
        <label for="direccion">Dirección:</label>
        <input type="text" id="direccion" v-model="clientData.direccion" required>
      </div>
      <div class="form-group">
        <label for="telefono">Teléfono:</label>
        <input type="tel" id="telefono" v-model="clientData.telefono" required>
      </div>

      <div class="form-group">
        <label for="correo">Correo Electrónico:</label>
        <input type="email" id="correo" v-model="clientData.correoElectronico" required>
      </div>
      
      <div class="form-actions full-width">
        <button type="submit" class="btn-primary">
          {{ isEditMode ? 'Guardar Cambios' : 'Crear Cliente' }}
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
// Asumimos que ClienteService ya fue creado en src/services/
import ClienteService from '@/services/ClienteService'; 

// 1. DEFINICIÓN DE PROPS Y RECURSOS
// Define las props que espera el componente (solo 'id' viene de la ruta de edición)
const props = defineProps({
  id: [String, Number] 
});

// Hook para acceder a la navegación (redirecciones)
const router = useRouter(); 

// Objeto reactivo para enlazar a los inputs del formulario
const clientData = ref({
  nombre: '',
  apellido: '',
  numeroIdentificacion: '',
  fechaNacimiento: '', // Formato YYYY-MM-DD
  direccion: '',
  correoElectronico: '',
  telefono: ''
});

// Variables para mensajes
const message = ref('');
const messageType = ref('');

// 2. LÓGICA DE MODO (CREAR vs. EDITAR)
// Propiedad computada para saber si estamos en modo Edición
const isEditMode = computed(() => !!props.id);


// 3. CARGAR DATOS EN MODO EDICIÓN
// Se ejecuta apenas se carga el componente
onMounted(() => {
  if (isEditMode.value) {
    fetchClientData(props.id);
  }
});

async function fetchClientData(id) {
  try {
    const response = await ClienteService.getClienteById(id);
    // Cargar los datos del cliente a la variable reactiva
    clientData.value = response.data;
    
    // El formato de fecha de tu API (YYYY-MM-DDTHH:mm:ss) puede necesitar ser recortado
    // para que el input type="date" funcione correctamente.
    if (clientData.value.fechaNacimiento) {
        clientData.value.fechaNacimiento = clientData.value.fechaNacimiento.substring(0, 10);
    }

  } catch (error) {
    console.error("Error al cargar datos del cliente:", error);
    showMessage("Error al cargar datos del cliente. Puede que el ID no exista.", 'error');
    // Considera redirigir a la lista si el cliente no existe
    router.push({ name: 'cliente-list' });
  }
}


// 4. LÓGICA DE ENVÍO DE FORMULARIO (POST/PUT)
async function saveClient() {
  message.value = ''; // Limpiar mensajes anteriores
  try {
    let response;
    
    if (isEditMode.value) {
      // MODO EDICIÓN: PUT /api/clientes/id-cliente/{id}
      response = await ClienteService.updateCliente(props.id, clientData.value);
      showMessage('Cliente actualizado exitosamente!', 'success');
    } else {
      // MODO CREACIÓN: POST /api/clientes
      response = await ClienteService.createCliente(clientData.value);
      showMessage('Cliente creado exitosamente! Redirigiendo...', 'success');
      
      // Redirigir al listado después de crear
      setTimeout(() => {
        router.push({ name: 'cliente-list' });
      }, 1500);
    }
    
    console.log("Respuesta de la API:", response.data);

  } catch (error) {
    console.error("Error en la operación:", error.response || error);
    let errorMessage = "Ocurrió un error desconocido al guardar.";

    // Manejo de errores específicos del backend (ej. Spring Validation o Cliente ya existe)
    if (error.response && error.response.data) {
        // Asumiendo que el backend devuelve un mensaje de error claro
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
    router.push({ name: 'cliente-list' });
}

</script>

<style scoped>
/* 5. ESTILOS SIMPLES */
.cliente-form-container {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.cliente-form {
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

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; /* Asegura que el padding no cambie el ancho total */
}

.form-actions {
  display: flex;
  justify-content: flex-start;
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
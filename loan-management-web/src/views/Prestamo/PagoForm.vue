<template>
  <div class="pago-form-container">
    <h2>Registrar Pago - Préstamo ID: {{ prestamoId }}</h2>

    <div v-if="prestamoInfo" class="prestamo-info">
      <h3>Información del Préstamo</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>Monto Total:</label>
          <span>${{ formatCurrency(prestamoInfo.montoPrincipal + (prestamoInfo.montoPrincipal * prestamoInfo.plazoMeses * prestamoInfo.tasaInteres)) }}</span>
        </div>
        <div class="info-item">
          <label>Monto Pagado:</label>
          <span>${{ formatCurrency(montoPagado) }}</span>
        </div>
        <div class="info-item">
          <label>Saldo Pendiente:</label>
          <span class="saldo-pendiente">${{ formatCurrency(calculateSaldo()) }}</span>
        </div>
      </div>
    </div>

    <form @submit.prevent="submitPago" class="pago-form">

      <div class="form-group">
        <label for="montoPago">Monto del Pago:</label>
        <input
          type="number"
          id="montoPago"
          v-model.number="pagoData.montoPago"
          step="0.01"
          min="0.01"
          :max="calculateSaldo()"
          required>
        <small class="hint">Máximo disponible: ${{ formatCurrency(calculateSaldo()) }}</small>
      </div>

      <div class="form-group">
        <label for="fechaPago">Fecha del Pago:</label>
        <input
          type="date"
          id="fechaPago"
          v-model="pagoData.fechaPago"
          required>
      </div>

      <div class="form-actions full-width">
        <button type="submit" class="btn-primary" :disabled="calculateSaldo() <= 0">
          Registrar Pago
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
import PrestamoService from '@/services/PrestamoService';

// Define las props que espera el componente (el 'id' viene de la ruta)
const props = defineProps({
  id: [String, Number]
});

// Hook para acceder a la navegación (redirecciones)
const router = useRouter();

// ID del préstamo
const prestamoId = computed(() => props.id);

// Información del préstamo
const prestamoInfo = ref(null);
const pagoTotal = ref(0);
const montoPagado = ref(0);
const isLoadingPrestamo = ref(false);

// Objeto reactivo para enlazar a los inputs del formulario
const pagoData = ref({
  montoPago: null,
  fechaPago: new Date().toISOString().split('T')[0] // Fecha actual por defecto
});

// Variables para mensajes
const message = ref('');
const messageType = ref('');

// Cargar información del préstamo al montar el componente
onMounted(() => {
  if (prestamoId.value) {
    loadPrestamoInfo();
  } else {
    showMessage('ID de préstamo no válido.', 'error');
    setTimeout(() => {
      router.push({ name: 'prestamo-list' });
    }, 2000);
  }
});

// Cargar información del préstamo
async function loadPrestamoInfo() {
  isLoadingPrestamo.value = true;
  try {
    const response = await PrestamoService.getPrestamoById(prestamoId.value);
    console.log(response);
    if (response && response.data) {
      prestamoInfo.value = response.data;

      const totalPagadoResponse = await PrestamoService.getPagoTotalByPrestamo(prestamoId.value);
      if (totalPagadoResponse && totalPagadoResponse.data !== undefined) {
        montoPagado.value = totalPagadoResponse.data; // Asigna el valor a tu variable reactiva
      } else {
        montoPagado.value = 0; // Si no hay datos, inicializa en 0
      }
      // Validar que el préstamo tenga saldo pendiente
      if (calculateSaldo() <= 0) {
        showMessage('Este préstamo ya está completamente pagado.', 'error');
      }
    } else {
      throw new Error('Respuesta inválida del servidor');
    }
  } catch (error) {
    console.error("Error al cargar información del préstamo:", error);
    console.error("Detalles del error:", error.response || error.message);

    let errorMessage = 'Error al cargar la información del préstamo. Puede que el ID no exista.';
    if (error.response) {
      errorMessage += ` (${error.response.status}: ${error.response.statusText})`;
    } else if (error.message) {
      errorMessage += ` (${error.message})`;
    }
    showMessage(errorMessage, 'error');

    setTimeout(() => {
      router.push({ name: 'prestamo-list' });
    }, 2000);
  } finally {
    isLoadingPrestamo.value = false;
  }
}

// Calcular saldo pendiente
function calculateSaldo() {
  if (!prestamoInfo.value) return 0;
  const montoTotal = parseFloat(prestamoInfo.value.montoPendiente || prestamoInfo.value.monto);
  // Assuming pagoTotal is the sum of all payments made
  const saldo = montoTotal - montoPagado.value;
  return Math.max(0, saldo);
}

// Formatear moneda
function formatCurrency(value) {
  if (value === null || value === undefined) return '0.00';
  return parseFloat(value).toFixed(2);
}

// Lógica de envío de formulario
async function submitPago() {
  message.value = ''; // Limpiar mensajes anteriores

  // Validación básica
  if (!pagoData.value.montoPago || !pagoData.value.fechaPago) {
    showMessage('Por favor, complete todos los campos.', 'error');
    return;
  }

  // Validar que el monto sea positivo
  if (pagoData.value.montoPago <= 0) {
    showMessage('El monto del pago debe ser mayor a cero.', 'error');
    return;
  }

  // Validar que el monto no exceda el saldo pendiente
  const saldo = calculateSaldo();
  if (pagoData.value.montoPago > saldo) {
    showMessage(`El monto del pago no puede exceder el saldo pendiente de $${formatCurrency(saldo)}.`, 'error');
    return;
  }

  try {
    // Create a payload object that includes prestamoID for the backend's PagoRequest
    const payload = {
      ...pagoData.value, // Spread existing montoPago and fechaPago
      prestamoID: prestamoId.value // Add prestamoID to the payload for the body
    };

    // Llama al endpoint POST /api/prestamo-id/{id}/pagos
    // The first argument is for the URL path variable, the second is the request body
    const response = await PrestamoService.createPago(prestamoId.value, payload);
    showMessage('Pago registrado exitosamente!', 'success');

    // Recargar información del préstamo para actualizar el saldo
    await loadPrestamoInfo();

    // Limpiar formulario
    pagoData.value.montoPago = null;
    pagoData.value.fechaPago = new Date().toISOString().split('T')[0];

    // Si el préstamo está completamente pagado, redirigir después de un momento
    if (calculateSaldo() <= 0) {
      setTimeout(() => {
        router.push({ name: 'prestamo-list' });
      }, 2000);
    }

  } catch (error) {
    console.error("Error en la operación:", error.response || error);
    let errorMessage = "Ocurrió un error desconocido al registrar el pago.";

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
  router.push({ name: 'prestamo-list' });
}

</script>

<style scoped>
/* Estilos consistentes con ClienteForm.vue */
.pago-form-container {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.prestamo-info {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  border: 1px solid #dee2e6;
}

.prestamo-info h3 {
  color: #004a8b;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: bold;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.info-item span {
  font-size: 1.1em;
  color: #333;
}

.saldo-pendiente {
  color: #dc3545;
  font-weight: bold;
  font-size: 1.2em !important;
}

.pago-form {
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

.hint {
  margin-top: 5px;
  font-size: 0.85em;
  color: #666;
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

.btn-primary:hover:not(:disabled) {
    background-color: #00376b;
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

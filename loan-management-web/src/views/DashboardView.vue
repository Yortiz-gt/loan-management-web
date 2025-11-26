<template>
  <div class="dashboard-container">
    <h1>Bienvenido al Panel de Control</h1>
    <p class="summary-text">Selecciona una opción para gestionar tu sistema de préstamos.</p>

    <div class="navigation-menu">
      <router-link to="/clientes" class="menu-card">
        <h2>Gestión de Clientes</h2>
        <p>Administra la información de todos tus clientes.</p>
      </router-link>

      <router-link to="/solicitudes" class="menu-card">
        <h2>Gestión de Solicitudes</h2>
        <p>Revisa y procesa las solicitudes de préstamo.</p>
      </router-link>

      <router-link to="/prestamos" class="menu-card">
        <h2>Gestión de Préstamos</h2>
        <p>Supervisa los préstamos activos, pagos y saldos.</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
// No reactive variables or data fetching needed for a simple navigation menu
</script>

<style scoped>
.dashboard-container {
  max-width: 900px;
  margin: 50px auto;
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
}

h1 {
  color: #004a8b;
  margin-bottom: 20px;
  font-size: 2.5em;
}

.summary-text {
  color: #555;
  margin-bottom: 50px;
  font-size: 1.2em;
  line-height: 1.6;
}

.navigation-menu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  justify-content: center;
}

.menu-card {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}

.menu-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.menu-card h2 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.8em;
}

.menu-card p {
  color: #666;
  font-size: 1em;
  line-height: 1.5;
}
</style>

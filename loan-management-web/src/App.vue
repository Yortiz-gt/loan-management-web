<script setup></script>

<template>
  <div id="app">
    <header class="app-header">
      <nav>
        <router-link to="/" class="nav-item">Inicio</router-link>
        <router-link to="/clientes" class="nav-item">Clientes</router-link>
        <router-link to="/solicitudes" class="nav-item">Solicitudes</router-link>
        <router-link to="/prestamos" class="nav-item">Préstamos & Pagos</router-link>
      </nav>
    </header>
    
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<style>
/* Estilos globales para la aplicación */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  background-color: #f4f4f9;
}
.app-header {
  background-color: #004a8b; /* Color institucional (azul oscuro) */
  padding: 15px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
nav {
  display: flex;
  gap: 20px;
}
.nav-item {
  color: white;
  text-decoration: none;
  font-weight: bold;
}
.nav-item:hover {
  text-decoration: underline;
}
.app-content {
  padding: 20px;
}
/* Estilo para los botones de las vistas */
.btn-primary {
  background-color: #28a745;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  margin-right: 10px;
}
</style>
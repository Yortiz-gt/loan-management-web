import { createRouter, createWebHistory } from 'vue-router';

// 1. Vistas de Módulos (usando lazy loading para optimizar el rendimiento)

// Cliente
const ClienteListView = () => import('../views/Cliente/ClienteList.vue');
const ClienteFormView = () => import('../views/Cliente/ClienteForm.vue');

// Solicitud
const SolicitudListView = () => import('../views/Solicitud/SolicitudList.vue');
const SolicitudCreateFormView = () => import('../views/Solicitud/SolicitudCreateForm.vue');
const SolicitudDetailView = () => import('../views/Solicitud/SolicitudDetail.vue');

// Prestamo (Incluye Listado y Pago)
const PrestamoListView = () => import('../views/Prestamo/PrestamoList.vue');
const PagoFormView = () => import('../views/Prestamo/PagoForm.vue');

// Dashboard / Inicio
const DashboardView = () => import('../views/DashboardView.vue'); 
// Asume que crearás un DashboardView.vue en src/views/

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView 
    },
    
    // --- GESTIÓN DE CLIENTES (/clientes) ---
    {
      path: '/clientes',
      name: 'cliente-list',
      component: ClienteListView,
    },
    {
      path: '/clientes/crear',
      name: 'cliente-create',
      component: ClienteFormView,
    },
    {
      // Ruta para editar (el :id es el parámetro variable)
      path: '/clientes/editar/:id', 
      name: 'cliente-edit',
      component: ClienteFormView,
      props: true // Permite que el 'id' sea pasado como prop al componente
    },

    // --- SOLICITUDES DE PRÉSTAMOS (/solicitudes) ---
    {
      path: '/solicitudes/crear',
      name: 'solicitud-create',
      component: SolicitudCreateFormView
    },
    {
      path: '/solicitudes',
      name: 'solicitud-list',
      component: SolicitudListView,
    },
    {
      // Puedes usar el mismo formulario para crear solicitudes si lo deseas, 
      // pero usaremos SolicitudDetail para la gestión de Aprobación/Rechazo.
      path: '/solicitudes/:id',
      name: 'solicitud-detail',
      component: SolicitudDetailView,
      props: true
    },

    // --- PRÉSTAMOS APROBADOS Y PAGOS (/prestamos) ---
    {
      path: '/prestamos',
      name: 'prestamo-list',
      component: PrestamoListView,
    },
    {
      // Ruta para registrar un nuevo pago a un préstamo específico
      path: '/prestamos/:id/pagos/registrar',
      name: 'pago-create',
      component: PagoFormView,
      props: true
    },
  ],
});

export default router;
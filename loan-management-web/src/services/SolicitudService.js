import api from './api'; // Asegúrate de que importas tu instancia de Axios

const API_PATH = '/api/solicitudes';

export default {
    /**
     * POST /api/solicitudes - Crea una nueva solicitud de préstamo.
     * @param {Object} data - { clienteID, montoSolicitado, plazoID }
     */
    createSolicitud(data) {
        return api.post(API_PATH, data);
    },

    /**
     * GET /api/solicitudes?page={page}&size={size} - Obtiene la lista de todas las solicitudes.
     */
    getAllSolicitudes(page = 1, size = 10) {
        return api.get(API_PATH, {
            params: { page, size }
        });
    },

    /**
     * GET /api/solicitudes/prestamo-id/{id} - Obtiene una solicitud específica.
     */
    getSolicitudById(id) {
        return api.get(`${API_PATH}/prestamo-id/${id}`);
    },

    /**
     * PUT /api/solicitudes/prestamo-id/{id}/aprobar - Aprueba una solicitud.
     * @param {Number} id - ID de la solicitud a aprobar.
     * @param {Object} data - { detalles: "..." }
     */
    aprobarSolicitud(id, data) {
        return api.put(`${API_PATH}/prestamo-id/${id}/aprobar`, data);
    },

    /**
     * PUT /api/solicitudes/prestamo-id/{id}/rechazar - Rechaza una solicitud.
     * @param {Number} id - ID de la solicitud a rechazar.
     * @param {Object} data - { detalles: "..." }
     */
    rechazarSolicitud(id, data) {
        return api.put(`${API_PATH}/prestamo-id/${id}/rechazar`, data);
    }
};
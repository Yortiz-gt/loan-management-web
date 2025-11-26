import api from './api';

const API_PATH = '/api/prestamos';
const API_PATH_PAGOS = '/api/pagos';

export default {
    /**
     * GET /api/prestamos?page={page}&size={size} - Obtiene la lista de todos los préstamos.
     */
    getAllPrestamos(page = 1, size = 10) {
        return api.get(API_PATH, {
            params: { page, size }
        });
    },

    /**
     * GET /api/prestamo-id/{id} - Obtiene un préstamo específico.
     */
    getPrestamoById(id) {
        return api.get(`${API_PATH}/prestamo-id/${id}`);
    },

    /**
     * GET /api/prestamo-id/{id}/pagos - Obtiene los pagos de un préstamo.
     */
    getPagosByPrestamo(id) {
        return api.get(`${API_PATH_PAGOS}/prestamo/${id}/pagos`);
    },

        /**
     * GET /api/prestamo-id/{id}/total-pagado - Obtiene los pagos de un préstamo.
     */
        getPagoTotalByPrestamo(id) {
            return api.get(`${API_PATH_PAGOS}/prestamo/${id}/total-pagado`);
        },
    /**
     * POST /api/prestamo-id/{id}/pagos - Registra un nuevo pago para un préstamo.
     * @param {Number} id - ID del préstamo
     * @param {Object} data - { montoPago, fechaPago }
     */
    createPago(id, data) {
        return api.post(`${API_PATH_PAGOS}`, data);
    }
};


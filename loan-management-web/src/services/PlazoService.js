import api from './api';

const API_PATH = '/api/solicitudes';

export default {
    // GET /tipos-plazo - Obtiene todos los plazos disponibles
    getAllPlazos() {
        return api.get(`${API_PATH}/tipos-plazo`);
    },

    // GET api/tipos-plazo/{id} - Obtiene un plazo específico
    getPlazoById(id) {
        return api.get(`${API_PATH}/tipos-plazo/${id}`);
    }
};


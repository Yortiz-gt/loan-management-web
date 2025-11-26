import api from './api';

const API_PATH = '/api/clientes';

export default {
    // GET /api/clientes?page={page}&size={size}
    getAllClientes(page = 1, size = 10) {
        return api.get(API_PATH, {
            params: { page, size }
        });
    },

    // GET /api/clientes/id-cliente/{id}
    getClienteById(id) {
        return api.get(`${API_PATH}/id-cliente/${id}`);
    },

    // POST /api/clientes (usado para crear)
    createCliente(clienteData) {
        return api.post(API_PATH, clienteData);
    },

    // PUT /api/clientes/id-cliente/{id} (usado para editar)
    updateCliente(id, clienteData) {
        return api.put(`${API_PATH}/id-cliente/${id}`, clienteData);
    },

    // DELETE /api/clientes/id-cliente/{id}
    deleteCliente(id) {
        return api.delete(`${API_PATH}/id-cliente/${id}`);
    }
};
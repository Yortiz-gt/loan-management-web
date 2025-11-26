import axios from 'axios';

// La URL base de tu backend Spring Boot (ajusta el puerto si es necesario)
const API_URL = 'http://localhost:8080'; 

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
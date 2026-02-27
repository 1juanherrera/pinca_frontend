import apiClient from "../../../api/apiClient";

export const getItems = () => apiClient.get('/instalaciones');

export const getItem = (id) => apiClient.get(`/instalaciones/${id}`);

export const createItem = (data) => apiClient.post('/instalaciones', data);

export const updateItem = ({ id, data }) => apiClient.put(`/instalaciones/${id}`, data);

export const deleteItem = (id) => apiClient.delete(`/instalaciones/${id}`);
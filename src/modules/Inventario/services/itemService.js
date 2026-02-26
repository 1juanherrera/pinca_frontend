import apiClient from "../../../api/apiClient";

export const getItems = () => apiClient.get('/item_general');

export const getItem = (id) => apiClient.get(`/item_general/${id}`);

export const createItem = (data) => apiClient.post('/item_general', data);

export const updateItem = ({ id, data }) => apiClient.put(`/item_general/${id}`, data);

export const deleteItem = (id) => apiClient.delete(`/item_general/${id}`);
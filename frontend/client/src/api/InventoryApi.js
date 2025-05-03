import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/inventory";

export const getInventory = async (ambulanceId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${ambulanceId}`);
        return response.data;
    } catch (error) {
        return { error: error.response?.data?.error || "Failed to fetch inventory" };
    }
};

export const addInventoryItem = async (ambulanceId, item) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/${ambulanceId}/add`, item);
        return response.data;
    } catch (error) {
        return { error: error.response?.data?.error || "Failed to add item" };
    }
};

export const updateInventoryItem = async (ambulanceId, itemId, updatedItem) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${ambulanceId}/update/${itemId}`, updatedItem);
        return response.data;
    } catch (error) {
        return { error: error.response?.data?.error || "Failed to update item" };
    }
};

export const deleteInventoryItem = async (ambulanceId, itemId, hospitalId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${ambulanceId}/delete/${itemId}/${hospitalId}`);
        return response.data;
    } catch (error) {
        return { error: error.response?.data?.error || "Failed to delete item" };
    }
};

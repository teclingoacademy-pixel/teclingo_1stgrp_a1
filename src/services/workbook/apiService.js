// src/services/apiService.js

import { apiUrl } from '../apiConfig';

const API_URL = 'https://script.google.com/macros/s/AKfycbx5mvsdlSFA48cNgU9-V16f7Xl507EAIR6nr75MGfnd52Ug_BP5TsQ2ptgDfeb_zLrNVQ/exec';

export const apiService = {
  // 1. Obtener datos de un usuario existente
  getUser: async (userId) => {
    try {
      const response = await fetch(`${API_URL}?action=getUser&user_id=${encodeURIComponent(userId)}`);
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  // 2. Crear un nuevo usuario (Registro)
  createUser: async (userData) => {
    try {
      // Usamos mode: 'no-cors' o text/plain si hay problemas de CORS, 
      // pero Google Apps Script maneja POST con text/plain mejor.
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'createUser',
          ...userData
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error creando usuario:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  // 3. Actualizar datos del usuario (XP, nivel, clases completadas)
  updateUser: async (userData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateUser',
          ...userData
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  // 4. Guardar el progreso de un reactivo respondido
  saveProgress: async (progressData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveProgress',
          ...progressData
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error guardando progreso:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  // 5. Obtener texto base de comprensión lectora
  getTextoBase: async (claseId) => {
    try {
      const response = await fetch(apiUrl(`/api/v1/textos-base?clase_id=${encodeURIComponent(claseId)}`));
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Error en apiService.getTextoBase vía HTTP:', error);
    }
    return { success: false, error: 'No se pudo obtener texto base' };
  }
};

export default apiService;

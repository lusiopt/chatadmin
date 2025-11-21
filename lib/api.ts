import axios from 'axios';

/**
 * Cliente Axios configurado com baseURL para lidar com basePath do Next.js
 *
 * No cliente (navegador): adiciona prefixo /chat para todas as requisições
 * No servidor (SSR): não adiciona prefixo (Next.js lida automaticamente)
 */
const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '/chat' : '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

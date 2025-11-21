/**
 * Helper para fazer requisições API com suporte a basePath
 *
 * O Next.js basePath funciona automaticamente apenas para navegação (Links, Router),
 * mas requisições fetch() precisam incluir o basePath manualmente quando rodando no cliente.
 */

const basePath = '/chat';

/**
 * Faz uma requisição fetch com o basePath correto
 *
 * @param url - URL relativa da API (ex: '/api/channels')
 * @param options - Opções do fetch (method, headers, body, etc)
 * @returns Response do fetch
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  // No servidor, Next.js lida com o basePath automaticamente
  // No cliente, precisamos adicionar manualmente
  const fullUrl = typeof window !== 'undefined' ? `${basePath}${url}` : url;

  return fetch(fullUrl, options);
}

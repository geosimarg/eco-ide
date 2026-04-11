import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface HttpHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface HttpRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: HttpHeader[];
  body: string;
  contentType: 'none' | 'json' | 'form' | 'text' | 'xml';
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export const useHttpClientStore = defineStore('http', () => {
  const requests = ref<HttpRequest[]>([]);
  const activeRequestId = ref<string | null>(null);
  const response = ref<HttpResponse | null>(null);
  const isLoading = ref(false);
  const history = ref<{ request: HttpRequest; response: HttpResponse; timestamp: number }[]>([]);

  const activeRequest = computed(() => {
    return requests.value.find(r => r.id === activeRequestId.value) || null;
  });

  function createRequest(): HttpRequest {
    const newRequest: HttpRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Nova Requisição',
      method: 'GET',
      url: '',
      headers: [],
      body: '',
      contentType: 'none',
    };
    requests.value.push(newRequest);
    activeRequestId.value = newRequest.id;
    return newRequest;
  }

  function updateRequest(id: string, updates: Partial<HttpRequest>) {
    const request = requests.value.find(r => r.id === id);
    if (request) {
      Object.assign(request, updates);
    }
  }

  function deleteRequest(id: string) {
    const index = requests.value.findIndex(r => r.id === id);
    if (index !== -1) {
      requests.value.splice(index, 1);
      if (activeRequestId.value === id) {
        activeRequestId.value = requests.value[0]?.id || null;
      }
    }
  }

  function addHeader(requestId: string) {
    const request = requests.value.find(r => r.id === requestId);
    if (request) {
      request.headers.push({ key: '', value: '', enabled: true });
    }
  }

  function removeHeader(requestId: string, index: number) {
    const request = requests.value.find(r => r.id === requestId);
    if (request) {
      request.headers.splice(index, 1);
    }
  }

  async function sendRequest(requestId: string): Promise<HttpResponse | null> {
    const request = requests.value.find(r => r.id === requestId);
    if (!request || !request.url) {
      return null;
    }

    isLoading.value = true;
    response.value = null;

    const startTime = Date.now();

    try {
      const headers: [string, string][] = [];
      request.headers.forEach(h => {
        if (h.enabled && h.key) {
          headers.push([h.key, h.value]);
        }
      });

      if (request.contentType !== 'none' && request.body) {
        if (request.contentType === 'json') {
          headers.push(['Content-Type', 'application/json']);
        } else if (request.contentType === 'form') {
          headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
        } else if (request.contentType === 'xml') {
          headers.push(['Content-Type', 'application/xml']);
        } else {
          headers.push(['Content-Type', 'text/plain']);
        }
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      const result = await invoke<{
        status: number;
        status_text: string;
        headers: [string, string][];
        body: string;
        time_ms: number;
      }>('send_http_request', {
        params: {
          method: request.method,
          url: request.url,
          headers: headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
        }
      });

      const responseHeaders: Record<string, string> = {};
      result.headers.forEach(([key, value]) => {
        responseHeaders[key] = value;
      });

      const httpResponse: HttpResponse = {
        status: result.status,
        statusText: result.status_text,
        headers: responseHeaders,
        body: result.body,
        time: result.time_ms,
        size: new Blob([result.body]).size,
      };

      response.value = httpResponse;

      history.value.unshift({
        request: { ...request },
        response: httpResponse,
        timestamp: Date.now(),
      });

      if (history.value.length > 50) {
        history.value.pop();
      }

      return httpResponse;
    } catch (error: any) {
      const endTime = Date.now();
      const httpResponse: HttpResponse = {
        status: 0,
        statusText: 'Erro',
        headers: {},
        body: error.message || 'Erro ao fazer requisição',
        time: endTime - startTime,
        size: 0,
      };
      response.value = httpResponse;
      return httpResponse;
    } finally {
      isLoading.value = false;
    }
  }

  function loadFromHistory(index: number) {
    const item = history.value[index];
    if (item) {
      // Clone the request and add to current requests
      const newRequest: HttpRequest = {
        ...item.request,
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${item.request.name} (from history)`,
      };
      requests.value.push(newRequest);
      activeRequestId.value = newRequest.id;
      response.value = item.response;
    }
  }

  function clearHistory() {
    history.value = [];
  }

  return {
    requests,
    activeRequestId,
    activeRequest,
    response,
    isLoading,
    history,
    createRequest,
    updateRequest,
    deleteRequest,
    addHeader,
    removeHeader,
    sendRequest,
    loadFromHistory,
    clearHistory,
  };
});

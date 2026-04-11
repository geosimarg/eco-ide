<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHttpClientStore } from '@/stores/httpClient';
import { useI18nStore } from '@/stores/i18n';

const httpStore = useHttpClientStore();
const i18n = useI18nStore();

const activeTab = ref<'params' | 'headers' | 'body'>('params');
const responseTab = ref<'body' | 'headers'>('body');
const activeRequestTab = ref<'requests' | 'history'>('requests');

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;

const contentTypes = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form' },
  { value: 'text', label: 'Text' },
  { value: 'xml', label: 'XML' },
];

const methodColors: Record<string, string> = {
  GET: '#69db7c',
  POST: '#ffa500',
  PUT: '#4dabf7',
  DELETE: '#ff6b6b',
  PATCH: '#da77f2',
  HEAD: '#868e96',
  OPTIONS: '#868e96',
};

const newRequest = () => {
  httpStore.createRequest();
};

const sendRequest = async () => {
  if (httpStore.activeRequestId) {
    await httpStore.sendRequest(httpStore.activeRequestId);
  }
};

const formatTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return '#69db7c';
  if (status >= 300 && status < 400) return '#ffa500';
  if (status >= 400 && status < 500) return '#ff6b6b';
  if (status >= 500) return '#dc3545';
  return '#868e96';
};

const isJson = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const formatResponseBody = (body: string) => {
  if (isJson(body)) {
    return JSON.stringify(JSON.parse(body), null, 2);
  }
  return body;
};

const copyResponse = async () => {
  if (httpStore.response?.body) {
    await navigator.clipboard.writeText(httpStore.response.body);
  }
};

const activeRequest = computed(() => httpStore.activeRequest);
const response = computed(() => httpStore.response);
const isLoading = computed(() => httpStore.isLoading);
const history = computed(() => httpStore.history);
const requests = computed(() => httpStore.requests);

// Handle keyboard shortcut
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    sendRequest();
  }
};
</script>

<template>
  <div class="http-client" @keydown="handleKeydown">
    <!-- Sidebar - Requests List -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>{{ i18n.t('http.requests') }}</h3>
        <button class="btn-icon" @click="newRequest" :title="i18n.t('http.new_request')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <div class="request-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeRequestTab === 'requests' }"
          @click="activeRequestTab = 'requests'"
        >
          {{ i18n.t('http.requests') }}
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeRequestTab === 'history' }"
          @click="activeRequestTab = 'history'"
        >
          {{ i18n.t('http.history') }}
        </button>
      </div>

      <div v-if="activeRequestTab === 'requests'" class="request-list">
        <div 
          v-for="req in requests" 
          :key="req.id"
          class="request-item"
          :class="{ active: req.id === activeRequest?.id }"
          @click="httpStore.activeRequestId = req.id"
        >
          <span class="method-dot" :style="{ background: methodColors[req.method] }"></span>
          <span class="request-name">{{ req.name || req.url || 'Untitled' }}</span>
          <button class="btn-delete" @click.stop="httpStore.deleteRequest(req.id)">×</button>
        </div>
        
        <div v-if="!requests.length" class="empty-state">
          <p>{{ i18n.t('http.no_requests') }}</p>
          <button class="btn-primary" @click="newRequest">{{ i18n.t('http.create_request') }}</button>
        </div>
      </div>

      <div v-else class="history-list">
        <div 
          v-for="(item, index) in history.slice(0, 20)" 
          :key="index" 
          class="history-item"
          @click="httpStore.loadFromHistory(index)"
        >
          <span class="method-badge" :style="{ color: methodColors[item.request.method] }">
            {{ item.request.method }}
          </span>
          <span class="history-url">{{ item.request.url }}</span>
          <span class="history-status" :style="{ color: getStatusColor(item.response.status) }">
            {{ item.response.status }}
          </span>
        </div>
        
        <div v-if="!history.length" class="empty-state">
          <p>{{ i18n.t('http.no_history') }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="activeRequest" class="main-content">
      <!-- URL Bar -->
      <div class="url-bar">
        <select 
          v-model="activeRequest.method" 
          class="method-select"
          :style="{ color: methodColors[activeRequest.method] }"
        >
          <option v-for="method in methods" :key="method" :value="method">
            {{ method }}
          </option>
        </select>
        
        <input 
          v-model="activeRequest.url" 
          type="text" 
          class="url-input" 
          :placeholder="i18n.t('http.url_placeholder')"
          @keydown.enter="sendRequest"
        />
        
        <button 
          class="btn-send" 
          @click="sendRequest"
          :disabled="isLoading || !activeRequest.url"
        >
          <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l12-6-4 6 4 6-12-6z" fill="currentColor"/>
          </svg>
          <span v-else class="spinner"></span>
          {{ isLoading ? i18n.t('http.sending') : i18n.t('http.send') }}
        </button>
      </div>

      <!-- Request Name -->
      <div class="request-name-row">
        <input 
          v-model="activeRequest.name" 
          type="text" 
          class="name-input"
          :placeholder="i18n.t('http.request_name')"
        />
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <div class="tab-headers">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'params' }"
            @click="activeTab = 'params'"
          >
            {{ i18n.t('http.params') }}
            <span v-if="activeRequest.headers.length" class="badge">{{ activeRequest.headers.length }}</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'headers' }"
            @click="activeTab = 'headers'"
          >
            {{ i18n.t('http.headers') }}
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'body' }"
            @click="activeTab = 'body'"
          >
            {{ i18n.t('http.body') }}
          </button>
        </div>

        <!-- Params Tab -->
        <div v-if="activeTab === 'params'" class="tab-panel">
          <div class="help-text">{{ i18n.t('http.params_help') }}</div>
          <div v-for="(header, index) in activeRequest.headers" :key="index" class="header-row">
            <input 
              type="checkbox" 
              v-model="header.enabled" 
              class="checkbox"
            />
            <input 
              v-model="header.key" 
              type="text" 
              class="input-key"
              :placeholder="i18n.t('http.key')"
            />
            <input 
              v-model="header.value" 
              type="text" 
              class="input-value"
              :placeholder="i18n.t('http.value')"
            />
            <button class="btn-remove" @click="httpStore.removeHeader(activeRequest.id, index)">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
          <button class="btn-add" @click="httpStore.addHeader(activeRequest.id)">
            + {{ i18n.t('http.add_param') }}
          </button>
        </div>

        <!-- Headers Tab -->
        <div v-if="activeTab === 'headers'" class="tab-panel">
          <div class="help-text">{{ i18n.t('http.headers_help') }}</div>
          <div v-for="(header, index) in activeRequest.headers" :key="index" class="header-row">
            <input 
              type="checkbox" 
              v-model="header.enabled" 
              class="checkbox"
            />
            <input 
              v-model="header.key" 
              type="text" 
              class="input-key"
              :placeholder="i18n.t('http.header_key')"
            />
            <input 
              v-model="header.value" 
              type="text" 
              class="input-value"
              :placeholder="i18n.t('http.header_value')"
            />
            <button class="btn-remove" @click="httpStore.removeHeader(activeRequest.id, index)">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
          <button class="btn-add" @click="httpStore.addHeader(activeRequest.id)">
            + {{ i18n.t('http.add_header') }}
          </button>
        </div>

        <!-- Body Tab -->
        <div v-if="activeTab === 'body'" class="tab-panel">
          <div class="content-type-row">
            <label>{{ i18n.t('http.content_type') }}:</label>
            <select v-model="activeRequest.contentType" class="select">
              <option v-for="ct in contentTypes" :key="ct.value" :value="ct.value">
                {{ ct.label }}
              </option>
            </select>
          </div>
          <textarea 
            v-model="activeRequest.body" 
            class="body-textarea"
            :placeholder="i18n.t('http.body_placeholder')"
            :disabled="activeRequest.contentType === 'none'"
          ></textarea>
        </div>
      </div>

      <!-- Response Section -->
      <div v-if="response" class="response-section">
        <div class="response-header">
          <div class="response-info">
            <span 
              class="status-badge"
              :style="{ background: getStatusColor(response.status) }"
            >
              {{ response.status }} {{ response.statusText }}
            </span>
            <span class="response-meta">
              {{ formatTime(response.time) }} • {{ formatSize(response.size) }}
            </span>
          </div>
          
          <div class="response-actions">
            <button class="btn-icon" @click="copyResponse" :title="i18n.t('http.copy')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 4V2.5A.5.5 0 009.5 2H2.5A.5.5 0 002 2.5V9.5a.5.5 0 00.5.5H4" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="response-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: responseTab === 'body' }"
            @click="responseTab = 'body'"
          >
            {{ i18n.t('http.response_body') }}
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: responseTab === 'headers' }"
            @click="responseTab = 'headers'"
          >
            {{ i18n.t('http.response_headers') }}
          </button>
        </div>

        <div v-if="responseTab === 'body'" class="response-body">
          <pre>{{ formatResponseBody(response.body) }}</pre>
        </div>

        <div v-else class="response-headers">
          <div v-for="(value, key) in response.headers" :key="key" class="response-header-row">
            <span class="header-key">{{ key }}</span>
            <span class="header-value">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-main">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M8 12h32M8 24h20M8 36h28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <h3>{{ i18n.t('http.no_request_selected') }}</h3>
      <p>{{ i18n.t('http.create_or_select') }}</p>
      <button class="btn-primary" @click="newRequest">
        + {{ i18n.t('http.new_request') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.http-client {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
}

/* Sidebar */
.sidebar {
  width: 240px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h3 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--accent-primary);
}

.request-tabs {
  display: flex;
  padding: 8px;
  gap: 4px;
  border-bottom: 1px solid var(--border-color);
}

.request-tabs .tab-btn {
  flex: 1;
  padding: 6px 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
}

.request-tabs .tab-btn.active {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.request-list,
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.request-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2px;
}

.request-item:hover {
  background: var(--bg-hover);
}

.request-item.active {
  background: var(--bg-tertiary);
}

.method-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.request-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-delete {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  border-radius: 4px;
}

.request-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: var(--error);
  color: white;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2px;
}

.history-item:hover {
  background: var(--bg-hover);
}

.method-badge {
  font-size: 10px;
  font-weight: 700;
  min-width: 45px;
}

.history-url {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-status {
  font-size: 11px;
  font-weight: 600;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.url-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.method-select {
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  min-width: 100px;
  cursor: pointer;
}

.url-input {
  flex: 1;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
}

.url-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.btn-send {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.btn-send:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.request-name-row {
  margin-bottom: 12px;
}

.name-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

/* Tabs */
.tabs {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.tab-headers {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.tab-btn {
  position: relative;
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-primary);
  background: var(--bg-secondary);
}

.badge {
  padding: 2px 6px;
  background: var(--accent-primary);
  color: white;
  font-size: 10px;
  border-radius: 10px;
}

.tab-panel {
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.help-text {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.header-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.input-key,
.input-value {
  flex: 1;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 12px;
}

.btn-remove {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
}

.btn-remove:hover {
  background: var(--error);
  color: white;
}

.btn-add {
  padding: 8px 12px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  margin-top: 8px;
}

.btn-add:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.content-type-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.content-type-row label {
  font-size: 12px;
  color: var(--text-secondary);
}

.select {
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 12px;
}

.body-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  resize: vertical;
}

.body-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.body-textarea:disabled {
  opacity: 0.5;
}

/* Response */
.response-section {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.response-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.response-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.response-actions {
  display: flex;
  gap: 8px;
}

.response-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.response-tabs .tab-btn {
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
}

.response-tabs .tab-btn.active {
  color: var(--accent-primary);
  border-bottom: 2px solid var(--accent-primary);
}

.response-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.response-body pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.response-headers {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.response-header-row {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
}

.response-header-row .header-key {
  width: 200px;
  color: var(--accent-primary);
  font-weight: 500;
}

.response-header-row .header-value {
  color: var(--text-primary);
  word-break: break-all;
}

/* Empty States */
.empty-state,
.empty-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--text-muted);
}

.empty-state p,
.empty-main p {
  font-size: 13px;
  margin-bottom: 16px;
}

.empty-main {
  flex: 1;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-main h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.btn-primary:hover {
  opacity: 0.9;
}
</style>
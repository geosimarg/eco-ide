import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './styles/main.css';
import { logger } from '@/utils/logger';

const app = createApp(App);
const pinia = createPinia();

app.config.errorHandler = (err, _instance, info) => {
  logger.error('Global Vue error: ' + String(err) + ' | Info: ' + String(info));
};

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection: ' + String(event.reason));
});

app.use(pinia);
app.mount('#app');

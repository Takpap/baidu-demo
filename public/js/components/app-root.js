// API 工具类
const API_BASE = '/api';

const api = {
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`);
    return res.json();
  },
  async post(path, data) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async put(path, data) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    return res.json();
  }
};

// 全局事件总线
const EventBus = {
  events: {},
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  },
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
};

// Toast 通知
function showToast(message, type = 'success') {
  EventBus.emit('toast', { message, type });
}

// 根组件
class AppRoot extends HTMLElement {
  constructor() {
    super();
    this.currentPage = 'campaign';
  }

  connectedCallback() {
    this.render();
    EventBus.on('navigate', (page) => {
      this.currentPage = page;
      this.render();
    });
  }

  render() {
    this.innerHTML = `
      <div class="min-h-screen">
        <app-nav current="${this.currentPage}"></app-nav>
        <main class="container mx-auto px-4 py-6">
          ${this.renderPage()}
        </main>
        <app-toast></app-toast>
        <modal-dialog></modal-dialog>
      </div>
    `;
  }

  renderPage() {
    const pages = {
      campaign: '<campaign-list></campaign-list>',
      adgroup: '<adgroup-list></adgroup-list>',
      keyword: '<keyword-list></keyword-list>',
      creative: '<creative-list></creative-list>',
      tracking: '<tracking-list></tracking-list>',
      'promotion-url': '<promotion-url-list></promotion-url-list>',
      click: '<click-list></click-list>',
      report: '<report-view></report-view>'
    };
    return pages[this.currentPage] || pages.campaign;
  }
}

customElements.define('app-root', AppRoot);

// Toast 通知组件
class AppToast extends HTMLElement {
  constructor() {
    super();
    this.toasts = [];
  }

  connectedCallback() {
    this.render();
    EventBus.on('toast', (data) => this.show(data));
  }

  show({ message, type = 'success' }) {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    this.render();
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.render();
    }, 3000);
  }

  render() {
    const typeStyles = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    this.innerHTML = `
      <div class="fixed top-20 right-4 z-50 space-y-2">
        ${this.toasts.map(toast => `
          <div class="${typeStyles[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg
            transform transition-all duration-300 flex items-center space-x-2">
            <span>${toast.message}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('app-toast', AppToast);

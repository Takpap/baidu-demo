// 模态框组件
class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.isOpen = false;
    this.title = '';
    this.content = '';
    this.onConfirm = null;
  }

  connectedCallback() {
    this.render();
    EventBus.on('modal:open', (data) => this.open(data));
    EventBus.on('modal:close', () => this.close());
  }

  open({ title, content, onConfirm, formFields }) {
    this.isOpen = true;
    this.title = title;
    this.content = content;
    this.formFields = formFields;
    this.onConfirm = onConfirm;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.render();
  }

  getFormData() {
    const form = this.querySelector('form');
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      // 尝试转换数字
      if (!isNaN(value) && value !== '') {
        data[key] = Number(value);
      } else {
        data[key] = value;
      }
    }
    return data;
  }

  render() {
    if (!this.isOpen) {
      this.innerHTML = '';
      return;
    }

    this.innerHTML = `
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold text-gray-900">${this.title}</h3>
            <button class="close-btn text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-4">
            ${this.formFields ? this.renderForm() : this.content}
          </div>
          <div class="flex justify-end space-x-3 p-4 border-t bg-gray-50">
            <button class="cancel-btn px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
              取消
            </button>
            <button class="confirm-btn px-4 py-2 text-white bg-baidu-blue rounded-lg hover:bg-baidu-light">
              确定
            </button>
          </div>
        </div>
      </div>
    `;

    this.querySelector('.close-btn').addEventListener('click', () => this.close());
    this.querySelector('.cancel-btn').addEventListener('click', () => this.close());
    this.querySelector('.confirm-btn').addEventListener('click', () => {
      if (this.onConfirm) {
        this.onConfirm(this.getFormData());
      }
      this.close();
    });
  }

  renderForm() {
    return `
      <form class="space-y-4">
        ${this.formFields.map(field => `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
            ${field.type === 'select' ? `
              <select name="${field.name}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-baidu-blue focus:border-transparent">
                ${field.options.map(opt => `
                  <option value="${opt.value}" ${field.value == opt.value ? 'selected' : ''}>${opt.label}</option>
                `).join('')}
              </select>
            ` : field.type === 'textarea' ? `
              <textarea name="${field.name}" rows="3"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-baidu-blue focus:border-transparent"
                placeholder="${field.placeholder || ''}">${field.value || ''}</textarea>
            ` : `
              <input type="${field.type || 'text'}" name="${field.name}"
                value="${field.value || ''}"
                placeholder="${field.placeholder || ''}"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-baidu-blue focus:border-transparent"
                ${field.required ? 'required' : ''}>
            `}
          </div>
        `).join('')}
      </form>
    `;
  }
}

customElements.define('modal-dialog', ModalDialog);

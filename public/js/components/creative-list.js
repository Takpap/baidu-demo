// 创意列表组件
class CreativeList extends HTMLElement {
  constructor() {
    super();
    this.creatives = [];
    this.adgroups = [];
    this.loading = true;
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();
    const [creativeRes, adgroupRes] = await Promise.all([
      api.get('/creative'),
      api.get('/adgroup')
    ]);
    if (creativeRes.code === 0) this.creatives = creativeRes.data;
    if (adgroupRes.code === 0) this.adgroups = adgroupRes.data;
    this.loading = false;
    this.render();
  }

  getAdgroupName(adgroupId) {
    const adgroup = this.adgroups.find(a => a.adgroupId === adgroupId);
    return adgroup ? adgroup.adgroupName : '-';
  }

  openCreateModal() {
    EventBus.emit('modal:open', {
      title: '创建创意',
      formFields: [
        { name: 'adgroupId', label: '所属单元', type: 'select', options: this.adgroups.map(a => ({ value: a.adgroupId, label: a.adgroupName })) },
        { name: 'title', label: '创意标题', type: 'text', placeholder: '请输入创意标题', required: true },
        { name: 'description1', label: '描述1', type: 'text', placeholder: '请输入描述1' },
        { name: 'description2', label: '描述2', type: 'text', placeholder: '请输入描述2' },
        { name: 'pcDestinationUrl', label: 'PC访问URL', type: 'text', placeholder: 'https://' },
        { name: 'mobileDestinationUrl', label: '移动访问URL', type: 'text', placeholder: 'https://' }
      ],
      onConfirm: async (data) => {
        const res = await api.post('/creative', data);
        if (res.code === 0) {
          showToast('创建成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openEditModal(creative) {
    EventBus.emit('modal:open', {
      title: '编辑创意',
      formFields: [
        { name: 'title', label: '创意标题', type: 'text', value: creative.title, required: true },
        { name: 'description1', label: '描述1', type: 'text', value: creative.description1 },
        { name: 'description2', label: '描述2', type: 'text', value: creative.description2 },
        { name: 'pcDestinationUrl', label: 'PC访问URL', type: 'text', value: creative.pcDestinationUrl },
        { name: 'mobileDestinationUrl', label: '移动访问URL', type: 'text', value: creative.mobileDestinationUrl },
        { name: 'status', label: '状态', type: 'select', value: creative.status, options: [
          { value: 1, label: '启用' },
          { value: 0, label: '暂停' }
        ]}
      ],
      onConfirm: async (data) => {
        const res = await api.put(`/creative/${creative.creativeId}`, data);
        if (res.code === 0) {
          showToast('更新成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  async deleteCreative(id) {
    if (!confirm('确定要删除此创意吗？')) return;
    const res = await api.delete(`/creative/${id}`);
    if (res.code === 0) {
      showToast('删除成功');
      this.loadData();
    } else {
      showToast(res.message, 'error');
    }
  }

  render() {
    this.innerHTML = `
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800">创意管理</h2>
          <button class="create-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>新建创意</span>
          </button>
        </div>

        ${this.loading ? `
          <div class="p-8 text-center text-gray-500">
            <div class="animate-spin w-8 h-8 border-4 border-baidu-blue border-t-transparent rounded-full mx-auto mb-2"></div>
            加载中...
          </div>
        ` : `
          <div class="grid gap-4 p-4">
            ${this.creatives.length === 0 ? `
              <div class="text-center text-gray-500 py-8">暂无数据</div>
            ` : this.creatives.map(c => `
              <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="text-xs text-gray-500">ID: ${c.creativeId}</span>
                      <span class="text-xs text-gray-400">|</span>
                      <span class="text-xs text-gray-500">${this.getAdgroupName(c.adgroupId)}</span>
                      <span class="px-2 py-0.5 text-xs rounded-full ${c.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${c.status === 1 ? '启用' : '暂停'}
                      </span>
                    </div>
                    <h3 class="text-blue-600 font-medium text-lg mb-1">${c.title}</h3>
                    <p class="text-gray-600 text-sm">${c.description1 || ''}</p>
                    <p class="text-gray-600 text-sm">${c.description2 || ''}</p>
                    <p class="text-green-600 text-xs mt-2">${c.pcDestinationUrl || ''}</p>
                  </div>
                  <div class="flex space-x-2 ml-4">
                    <button class="edit-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${c.creativeId}">编辑</button>
                    <button class="delete-btn text-red-600 hover:text-red-800 text-sm" data-id="${c.creativeId}">删除</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    this.querySelector('.create-btn')?.addEventListener('click', () => this.openCreateModal());
    this.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const creative = this.creatives.find(c => c.creativeId === parseInt(btn.dataset.id));
        if (creative) this.openEditModal(creative);
      });
    });
    this.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteCreative(parseInt(btn.dataset.id)));
    });
  }
}

customElements.define('creative-list', CreativeList);

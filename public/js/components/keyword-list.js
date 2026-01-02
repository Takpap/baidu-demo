// 关键词列表组件
class KeywordList extends HTMLElement {
  constructor() {
    super();
    this.keywords = [];
    this.adgroups = [];
    this.loading = true;
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();
    const [keywordRes, adgroupRes] = await Promise.all([
      api.get('/keyword'),
      api.get('/adgroup')
    ]);
    if (keywordRes.code === 0) this.keywords = keywordRes.data;
    if (adgroupRes.code === 0) this.adgroups = adgroupRes.data;
    this.loading = false;
    this.render();
  }

  getAdgroupName(adgroupId) {
    const adgroup = this.adgroups.find(a => a.adgroupId === adgroupId);
    return adgroup ? adgroup.adgroupName : '-';
  }

  getMatchTypeName(type) {
    const types = { 1: '精确匹配', 2: '短语匹配', 3: '广泛匹配' };
    return types[type] || '-';
  }

  openCreateModal() {
    EventBus.emit('modal:open', {
      title: '创建关键词',
      formFields: [
        { name: 'adgroupId', label: '所属单元', type: 'select', options: this.adgroups.map(a => ({ value: a.adgroupId, label: a.adgroupName })) },
        { name: 'keyword', label: '关键词', type: 'text', placeholder: '请输入关键词', required: true },
        { name: 'matchType', label: '匹配类型', type: 'select', value: 1, options: [
          { value: 1, label: '精确匹配' },
          { value: 2, label: '短语匹配' },
          { value: 3, label: '广泛匹配' }
        ]},
        { name: 'price', label: '出价(元)', type: 'number', placeholder: '1.00', value: 1 }
      ],
      onConfirm: async (data) => {
        const res = await api.post('/keyword', data);
        if (res.code === 0) {
          showToast('创建成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openEditModal(keyword) {
    EventBus.emit('modal:open', {
      title: '编辑关键词',
      formFields: [
        { name: 'keyword', label: '关键词', type: 'text', value: keyword.keyword, required: true },
        { name: 'matchType', label: '匹配类型', type: 'select', value: keyword.matchType, options: [
          { value: 1, label: '精确匹配' },
          { value: 2, label: '短语匹配' },
          { value: 3, label: '广泛匹配' }
        ]},
        { name: 'price', label: '出价(元)', type: 'number', value: keyword.price },
        { name: 'status', label: '状态', type: 'select', value: keyword.status, options: [
          { value: 1, label: '启用' },
          { value: 0, label: '暂停' }
        ]}
      ],
      onConfirm: async (data) => {
        const res = await api.put(`/keyword/${keyword.keywordId}`, data);
        if (res.code === 0) {
          showToast('更新成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  async deleteKeyword(id) {
    if (!confirm('确定要删除此关键词吗？')) return;
    const res = await api.delete(`/keyword/${id}`);
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
          <h2 class="text-xl font-semibold text-gray-800">关键词管理</h2>
          <button class="create-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>新建关键词</span>
          </button>
        </div>

        ${this.loading ? `
          <div class="p-8 text-center text-gray-500">
            <div class="animate-spin w-8 h-8 border-4 border-baidu-blue border-t-transparent rounded-full mx-auto mb-2"></div>
            加载中...
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">关键词ID</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">关键词</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">所属单元</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">匹配类型</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">出价</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${this.keywords.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                ` : this.keywords.map(k => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">${k.keywordId}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 font-medium">${k.keyword}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${this.getAdgroupName(k.adgroupId)}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        ${this.getMatchTypeName(k.matchType)}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900">¥${k.price.toFixed(2)}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs rounded-full ${k.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${k.status === 1 ? '启用' : '暂停'}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-2">
                        <button class="edit-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${k.keywordId}">编辑</button>
                        <button class="delete-btn text-red-600 hover:text-red-800 text-sm" data-id="${k.keywordId}">删除</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    this.querySelector('.create-btn')?.addEventListener('click', () => this.openCreateModal());
    this.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const keyword = this.keywords.find(k => k.keywordId === parseInt(btn.dataset.id));
        if (keyword) this.openEditModal(keyword);
      });
    });
    this.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteKeyword(parseInt(btn.dataset.id)));
    });
  }
}

customElements.define('keyword-list', KeywordList);

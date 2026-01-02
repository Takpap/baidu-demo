// 推广单元列表组件
class AdgroupList extends HTMLElement {
  constructor() {
    super();
    this.adgroups = [];
    this.campaigns = [];
    this.loading = true;
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();
    const [adgroupRes, campaignRes] = await Promise.all([
      api.get('/adgroup'),
      api.get('/campaign')
    ]);
    if (adgroupRes.code === 0) this.adgroups = adgroupRes.data;
    if (campaignRes.code === 0) this.campaigns = campaignRes.data;
    this.loading = false;
    this.render();
  }

  getCampaignName(campaignId) {
    const campaign = this.campaigns.find(c => c.campaignId === campaignId);
    return campaign ? campaign.campaignName : '-';
  }

  openCreateModal() {
    EventBus.emit('modal:open', {
      title: '创建推广单元',
      formFields: [
        { name: 'campaignId', label: '所属计划', type: 'select', options: this.campaigns.map(c => ({ value: c.campaignId, label: c.campaignName })) },
        { name: 'adgroupName', label: '单元名称', type: 'text', placeholder: '请输入单元名称', required: true },
        { name: 'maxPrice', label: '最高出价(元)', type: 'number', placeholder: '1.00', value: 1 }
      ],
      onConfirm: async (data) => {
        const res = await api.post('/adgroup', data);
        if (res.code === 0) {
          showToast('创建成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openEditModal(adgroup) {
    EventBus.emit('modal:open', {
      title: '编辑推广单元',
      formFields: [
        { name: 'adgroupName', label: '单元名称', type: 'text', value: adgroup.adgroupName, required: true },
        { name: 'maxPrice', label: '最高出价(元)', type: 'number', value: adgroup.maxPrice },
        { name: 'status', label: '状态', type: 'select', value: adgroup.status, options: [
          { value: 1, label: '启用' },
          { value: 0, label: '暂停' }
        ]}
      ],
      onConfirm: async (data) => {
        const res = await api.put(`/adgroup/${adgroup.adgroupId}`, data);
        if (res.code === 0) {
          showToast('更新成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  async deleteAdgroup(id) {
    if (!confirm('确定要删除此推广单元吗？')) return;
    const res = await api.delete(`/adgroup/${id}`);
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
          <h2 class="text-xl font-semibold text-gray-800">推广单元管理</h2>
          <button class="create-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>新建单元</span>
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
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">单元ID</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">单元名称</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">所属计划</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">最高出价</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${this.adgroups.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                ` : this.adgroups.map(a => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">${a.adgroupId}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 font-medium">${a.adgroupName}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${this.getCampaignName(a.campaignId)}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">¥${a.maxPrice.toFixed(2)}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs rounded-full ${a.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${a.status === 1 ? '启用' : '暂停'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${a.createTime}</td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-2">
                        <button class="edit-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${a.adgroupId}">编辑</button>
                        <button class="delete-btn text-red-600 hover:text-red-800 text-sm" data-id="${a.adgroupId}">删除</button>
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
        const adgroup = this.adgroups.find(a => a.adgroupId === parseInt(btn.dataset.id));
        if (adgroup) this.openEditModal(adgroup);
      });
    });
    this.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteAdgroup(parseInt(btn.dataset.id)));
    });
  }
}

customElements.define('adgroup-list', AdgroupList);

// 推广计划列表组件
class CampaignList extends HTMLElement {
  constructor() {
    super();
    this.campaigns = [];
    this.loading = true;
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();
    const res = await api.get('/campaign');
    if (res.code === 0) {
      this.campaigns = res.data;
    }
    this.loading = false;
    this.render();
  }

  openCreateModal() {
    EventBus.emit('modal:open', {
      title: '创建推广计划',
      formFields: [
        { name: 'userId', label: '用户ID', type: 'number', value: 10001, required: true },
        { name: 'campaignName', label: '计划名称', type: 'text', placeholder: '请输入计划名称', required: true },
        { name: 'budget', label: '日预算(元)', type: 'number', placeholder: '100', value: 100 },
        { name: 'startDate', label: '开始日期', type: 'date', value: new Date().toISOString().split('T')[0] },
        { name: 'endDate', label: '结束日期', type: 'date' }
      ],
      onConfirm: async (data) => {
        const res = await api.post('/campaign', data);
        if (res.code === 0) {
          showToast('创建成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openEditModal(campaign) {
    EventBus.emit('modal:open', {
      title: '编辑推广计划',
      formFields: [
        { name: 'campaignName', label: '计划名称', type: 'text', value: campaign.campaignName, required: true },
        { name: 'budget', label: '日预算(元)', type: 'number', value: campaign.budget },
        { name: 'status', label: '状态', type: 'select', value: campaign.status, options: [
          { value: 1, label: '启用' },
          { value: 0, label: '暂停' }
        ]},
        { name: 'startDate', label: '开始日期', type: 'date', value: campaign.startDate },
        { name: 'endDate', label: '结束日期', type: 'date', value: campaign.endDate }
      ],
      onConfirm: async (data) => {
        const res = await api.put(`/campaign/${campaign.campaignId}`, data);
        if (res.code === 0) {
          showToast('更新成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  async deleteCampaign(id) {
    if (!confirm('确定要删除此推广计划吗？')) return;
    const res = await api.delete(`/campaign/${id}`);
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
          <h2 class="text-xl font-semibold text-gray-800">推广计划管理</h2>
          <button class="create-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>新建计划</span>
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
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">计划ID</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">计划名称</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">日预算</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">投放日期</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${this.campaigns.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                ` : this.campaigns.map(c => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">${c.campaignId}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 font-medium">${c.campaignName}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">¥${c.budget.toFixed(2)}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs rounded-full ${c.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${c.status === 1 ? '启用' : '暂停'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${c.startDate || '-'} ~ ${c.endDate || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${c.createTime}</td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-2">
                        <button class="edit-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${c.campaignId}">编辑</button>
                        <button class="delete-btn text-red-600 hover:text-red-800 text-sm" data-id="${c.campaignId}">删除</button>
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
        const campaign = this.campaigns.find(c => c.campaignId === parseInt(btn.dataset.id));
        if (campaign) this.openEditModal(campaign);
      });
    });
    this.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteCampaign(parseInt(btn.dataset.id)));
    });
  }
}

customElements.define('campaign-list', CampaignList);

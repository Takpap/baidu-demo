// 监测链接列表组件
class TrackingList extends HTMLElement {
  constructor() {
    super();
    this.trackings = [];
    this.campaigns = [];
    this.loading = true;
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();
    const [trackingRes, campaignRes] = await Promise.all([
      api.get('/tracking'),
      api.get('/campaign')
    ]);
    if (trackingRes.code === 0) this.trackings = trackingRes.data;
    if (campaignRes.code === 0) this.campaigns = campaignRes.data;
    this.loading = false;
    this.render();
  }

  getCampaignName(campaignId) {
    const campaign = this.campaigns.find(c => c.campaignId === campaignId);
    return campaign ? campaign.campaignName : '-';
  }

  getTrackingTypeName(type) {
    const types = { 1: '基础监测', 2: '转化监测', 3: '深度转化监测' };
    return types[type] || '-';
  }

  copyToClipboard(text, successMsg = '已复制到剪贴板') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(successMsg);
    });
  }

  openCreateModal() {
    EventBus.emit('modal:open', {
      title: '创建监测链接',
      formFields: [
        { name: 'campaignId', label: '所属计划', type: 'select', options: this.campaigns.map(c => ({ value: c.campaignId, label: c.campaignName })) },
        { name: 'trackingName', label: '监测名称', type: 'text', placeholder: '请输入监测名称', required: true },
        { name: 'trackingUrl', label: '监测链接', type: 'textarea', placeholder: 'https://example.com?utm_source=baidu&utm_campaign={campaignid}', required: true },
        { name: 'trackingType', label: '监测类型', type: 'select', value: 1, options: [
          { value: 1, label: '基础监测' },
          { value: 2, label: '转化监测' },
          { value: 3, label: '深度转化监测' }
        ]}
      ],
      onConfirm: async (data) => {
        const res = await api.post('/tracking', data);
        if (res.code === 0) {
          showToast('创建成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openEditModal(tracking) {
    EventBus.emit('modal:open', {
      title: '编辑监测链接',
      formFields: [
        { name: 'trackingName', label: '监测名称', type: 'text', value: tracking.trackingName, required: true },
        { name: 'trackingUrl', label: '监测链接', type: 'textarea', value: tracking.trackingUrl, required: true },
        { name: 'trackingType', label: '监测类型', type: 'select', value: tracking.trackingType, options: [
          { value: 1, label: '基础监测' },
          { value: 2, label: '转化监测' },
          { value: 3, label: '深度转化监测' }
        ]},
        { name: 'status', label: '状态', type: 'select', value: tracking.status, options: [
          { value: 1, label: '启用' },
          { value: 0, label: '暂停' }
        ]}
      ],
      onConfirm: async (data) => {
        const res = await api.put(`/tracking/${tracking.trackingId}`, data);
        if (res.code === 0) {
          showToast('更新成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openGenerateModal() {
    EventBus.emit('modal:open', {
      title: '生成监测链接',
      formFields: [
        { name: 'baseUrl', label: '基础URL', type: 'text', placeholder: 'https://baidu.tempocc.cn/landing', required: true },
        { name: 'channelCode', label: '渠道码', type: 'text', placeholder: 'WXQYJCTT-AXSYAAAAAB1000117' }
      ],
      onConfirm: async (data) => {
        const res = await api.post('/tracking/generate', data);
        if (res.code === 0) {
          this.copyToClipboard(res.data.generatedUrl, '监测链接已复制到剪贴板');
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  async deleteTracking(id) {
    if (!confirm('确定要删除此监测链接吗？')) return;
    const res = await api.delete(`/tracking/${id}`);
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
          <h2 class="text-xl font-semibold text-gray-800">监测链接管理</h2>
          <div class="flex space-x-2">
            <button class="generate-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
              <span>生成链接</span>
            </button>
            <button class="create-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light flex items-center space-x-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>新建监测</span>
            </button>
          </div>
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
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">监测ID</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">监测名称</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">所属计划</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">监测类型</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">监测链接</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${this.trackings.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                ` : this.trackings.map(t => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">${t.trackingId}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 font-medium">${t.trackingName}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${this.getCampaignName(t.campaignId)}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        ${this.getTrackingTypeName(t.trackingType)}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <div class="flex items-center space-x-2">
                        <span class="truncate flex-1" title="${t.trackingUrl}">${t.trackingUrl}</span>
                        <button class="copy-btn flex-shrink-0 p-1 text-gray-400 hover:text-baidu-blue rounded hover:bg-gray-100" data-url="${encodeURIComponent(t.trackingUrl)}" title="复制链接">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs rounded-full ${t.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${t.status === 1 ? '启用' : '暂停'}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-2">
                        <button class="copy-full-btn text-green-600 hover:text-green-800 text-sm" data-url="${encodeURIComponent(t.trackingUrl)}">复制</button>
                        <button class="edit-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${t.trackingId}">编辑</button>
                        <button class="delete-btn text-red-600 hover:text-red-800 text-sm" data-id="${t.trackingId}">删除</button>
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
    this.querySelector('.generate-btn')?.addEventListener('click', () => this.openGenerateModal());

    // 复制按钮事件
    this.querySelectorAll('.copy-btn, .copy-full-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = decodeURIComponent(btn.dataset.url);
        this.copyToClipboard(url, '监测链接已复制');
      });
    });

    this.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tracking = this.trackings.find(t => t.trackingId === parseInt(btn.dataset.id));
        if (tracking) this.openEditModal(tracking);
      });
    });
    this.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteTracking(parseInt(btn.dataset.id)));
    });
  }
}

customElements.define('tracking-list', TrackingList);

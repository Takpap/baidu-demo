// 推广链接列表组件
class PromotionUrlList extends HTMLElement {
  constructor() {
    super();
    this.urls = [];
    this.campaigns = [];
    this.adgroups = [];
    this.loading = true;
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();
    const [urlRes, campaignRes, adgroupRes] = await Promise.all([
      api.get('/promotion-url'),
      api.get('/campaign'),
      api.get('/adgroup')
    ]);
    if (urlRes.code === 0) this.urls = urlRes.data;
    if (campaignRes.code === 0) this.campaigns = campaignRes.data;
    if (adgroupRes.code === 0) this.adgroups = adgroupRes.data;
    this.loading = false;
    this.render();
  }

  getCampaignName(campaignId) {
    const campaign = this.campaigns.find(c => c.campaignId === campaignId);
    return campaign ? campaign.campaignName : '-';
  }

  getAdgroupName(adgroupId) {
    const adgroup = this.adgroups.find(a => a.adgroupId === adgroupId);
    return adgroup ? adgroup.adgroupName : '-';
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
      title: '创建推广链接',
      formFields: [
        { name: 'campaignId', label: '所属计划', type: 'select', options: this.campaigns.map(c => ({ value: c.campaignId, label: c.campaignName })) },
        { name: 'adgroupId', label: '所属单元', type: 'select', options: this.adgroups.map(a => ({ value: a.adgroupId, label: a.adgroupName })) },
        { name: 'urlName', label: '链接名称', type: 'text', placeholder: '请输入链接名称', required: true },
        { name: 'pcUrl', label: 'PC链接', type: 'text', placeholder: 'https://baidu.tempocc.cn/', required: true },
        { name: 'mobileUrl', label: '移动链接', type: 'text', placeholder: 'https://baidu.tempocc.cn/' },
        { name: 'displayUrl', label: '显示URL', type: 'text', placeholder: 'baidu.tempocc.cn' }
      ],
      onConfirm: async (data) => {
        const res = await api.post('/promotion-url', data);
        if (res.code === 0) {
          showToast('创建成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openEditModal(url) {
    EventBus.emit('modal:open', {
      title: '编辑推广链接',
      formFields: [
        { name: 'urlName', label: '链接名称', type: 'text', value: url.urlName, required: true },
        { name: 'pcUrl', label: 'PC链接', type: 'text', value: url.pcUrl, required: true },
        { name: 'mobileUrl', label: '移动链接', type: 'text', value: url.mobileUrl },
        { name: 'displayUrl', label: '显示URL', type: 'text', value: url.displayUrl },
        { name: 'status', label: '状态', type: 'select', value: url.status, options: [
          { value: 1, label: '启用' },
          { value: 0, label: '暂停' }
        ]}
      ],
      onConfirm: async (data) => {
        const res = await api.put(`/promotion-url/${url.urlId}`, data);
        if (res.code === 0) {
          showToast('更新成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  async validateUrl(url) {
    const res = await api.post('/promotion-url/validate', { url: url.pcUrl });
    if (res.code === 0) {
      const data = res.data;
      alert(`链接验证结果:\n\n链接: ${data.url}\n状态: ${data.isValid ? '有效' : '无效'}\n响应码: ${data.statusCode}\n响应时间: ${data.responseTime}ms`);
    }
  }

  async deleteUrl(id) {
    if (!confirm('确定要删除此推广链接吗？')) return;
    const res = await api.delete(`/promotion-url/${id}`);
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
          <h2 class="text-xl font-semibold text-gray-800">推广链接管理</h2>
          <button class="create-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>新建链接</span>
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
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">链接ID</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">链接名称</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">所属计划</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">所属单元</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">PC链接</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">移动链接</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${this.urls.length === 0 ? `
                  <tr>
                    <td colspan="8" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                ` : this.urls.map(u => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">${u.urlId}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 font-medium">${u.urlName}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${this.getCampaignName(u.campaignId)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${this.getAdgroupName(u.adgroupId)}</td>
                    <td class="px-4 py-3 text-sm text-blue-600 max-w-xs">
                      <div class="flex items-center space-x-2">
                        <span class="truncate flex-1" title="${u.pcUrl}">${u.pcUrl}</span>
                        <button class="copy-pc-btn flex-shrink-0 p-1 text-gray-400 hover:text-baidu-blue rounded hover:bg-gray-100" data-url="${encodeURIComponent(u.pcUrl)}" title="复制PC链接">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-green-600 max-w-xs">
                      <div class="flex items-center space-x-2">
                        <span class="truncate flex-1" title="${u.mobileUrl || ''}">${u.mobileUrl || '-'}</span>
                        ${u.mobileUrl ? `
                          <button class="copy-mobile-btn flex-shrink-0 p-1 text-gray-400 hover:text-baidu-blue rounded hover:bg-gray-100" data-url="${encodeURIComponent(u.mobileUrl)}" title="复制移动链接">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs rounded-full ${u.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${u.status === 1 ? '启用' : '暂停'}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-2">
                        <button class="copy-all-btn text-green-600 hover:text-green-800 text-sm" data-pc="${encodeURIComponent(u.pcUrl)}" data-mobile="${encodeURIComponent(u.mobileUrl || '')}">复制</button>
                        <button class="validate-btn text-purple-600 hover:text-purple-800 text-sm" data-id="${u.urlId}">验证</button>
                        <button class="edit-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${u.urlId}">编辑</button>
                        <button class="delete-btn text-red-600 hover:text-red-800 text-sm" data-id="${u.urlId}">删除</button>
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

    // 复制PC链接
    this.querySelectorAll('.copy-pc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = decodeURIComponent(btn.dataset.url);
        this.copyToClipboard(url, 'PC链接已复制');
      });
    });

    // 复制移动链接
    this.querySelectorAll('.copy-mobile-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = decodeURIComponent(btn.dataset.url);
        this.copyToClipboard(url, '移动链接已复制');
      });
    });

    // 复制全部链接
    this.querySelectorAll('.copy-all-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pcUrl = decodeURIComponent(btn.dataset.pc);
        const mobileUrl = decodeURIComponent(btn.dataset.mobile);
        let text = `PC链接: ${pcUrl}`;
        if (mobileUrl) {
          text += `\n移动链接: ${mobileUrl}`;
        }
        this.copyToClipboard(text, '推广链接已复制');
      });
    });

    this.querySelectorAll('.validate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = this.urls.find(u => u.urlId === parseInt(btn.dataset.id));
        if (url) this.validateUrl(url);
      });
    });
    this.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = this.urls.find(u => u.urlId === parseInt(btn.dataset.id));
        if (url) this.openEditModal(url);
      });
    });
    this.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteUrl(parseInt(btn.dataset.id)));
    });
  }
}

customElements.define('promotion-url-list', PromotionUrlList);

// 转化回传管理组件
class ConversionList extends HTMLElement {
  constructor() {
    super();
    this.history = [];
    this.clicks = [];
    this.config = { token: '', apiUrl: '' };
    this.autoUploadConfig = { enabled: false, types: [], delay: 0 };
    this.conversionTypes = {};
    this.pagination = { page: 1, pageSize: 20, total: 0 };
    this.loading = true;
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();

    const [configRes, autoConfigRes, typesRes, historyRes, clicksRes] = await Promise.all([
      api.get('/conversion/config'),
      api.get('/conversion/auto-upload/config'),
      api.get('/conversion/types'),
      api.get(`/conversion/history?page=${this.pagination.page}&pageSize=${this.pagination.pageSize}`),
      api.get('/click/list?pageSize=100')
    ]);

    if (configRes.code === 0) this.config = configRes.data;
    if (autoConfigRes.code === 0) this.autoUploadConfig = autoConfigRes.data;
    if (typesRes.code === 0) this.conversionTypes = typesRes.data;
    if (historyRes.code === 0) {
      this.history = historyRes.data.list;
      this.pagination = historyRes.data.pagination;
    }
    if (clicksRes.code === 0) this.clicks = clicksRes.data.list;

    this.loading = false;
    this.render();
  }

  copyToClipboard(text, successMsg = '已复制到剪贴板') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(successMsg);
    });
  }

  openConfigModal() {
    EventBus.emit('modal:open', {
      title: '配置API Token',
      formFields: [
        { name: 'token', label: 'API Token', type: 'text', value: this.config.token, placeholder: '请输入百度营销API Token', required: true },
        { name: 'apiUrl', label: 'API地址', type: 'text', value: this.config.apiUrl || 'https://ocpc.baidu.com/ocpcapi/api/uploadConvertData', placeholder: 'https://ocpc.baidu.com/ocpcapi/api/uploadConvertData' }
      ],
      onConfirm: async (data) => {
        const res = await api.post('/conversion/config', data);
        if (res.code === 0) {
          showToast('配置保存成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openAutoUploadConfigModal() {
    const typeOptions = Object.entries(this.conversionTypes).map(([value, typeInfo]) => ({
      value: parseInt(value),
      label: `${value} - ${typeof typeInfo === 'object' ? typeInfo.name : typeInfo}`,
      selected: this.autoUploadConfig.types.includes(parseInt(value))
    }));

    // 创建自定义内容用于多选
    const content = `
      <div class="space-y-4">
        <div>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" id="auto-enabled" class="w-4 h-4 text-blue-600" ${this.autoUploadConfig.enabled ? 'checked' : ''}>
            <span class="text-gray-700">启用自动回传</span>
          </label>
          <p class="text-sm text-gray-500 mt-1">启用后，当有新的点击访问落地页时，将自动回传配置的转化类型</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">自动回传的转化类型</label>
          <div class="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
            ${typeOptions.map(opt => `
              <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input type="checkbox" class="type-checkbox w-4 h-4 text-blue-600" value="${opt.value}" ${opt.selected ? 'checked' : ''}>
                <span class="text-sm text-gray-700">${opt.label}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">延迟回传（秒）</label>
          <input type="number" id="auto-delay" class="w-full px-3 py-2 border rounded-lg" value="${this.autoUploadConfig.delay || 0}" min="0" placeholder="0表示立即回传">
          <p class="text-sm text-gray-500 mt-1">设置延迟可以模拟用户在页面停留后再转化的场景</p>
        </div>
      </div>
    `;

    EventBus.emit('modal:open', {
      title: '自动回传配置',
      content,
      onConfirm: async () => {
        const enabled = document.getElementById('auto-enabled').checked;
        const delay = parseInt(document.getElementById('auto-delay').value) || 0;
        const types = Array.from(document.querySelectorAll('.type-checkbox:checked')).map(cb => parseInt(cb.value));

        const res = await api.post('/conversion/auto-upload/config', { enabled, types, delay });
        if (res.code === 0) {
          showToast('自动回传配置已保存');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openUploadModal() {
    const clickOptions = this.clicks
      .filter(c => c.bd_vid || c.ext_info)
      .map(c => ({
        value: c.id,
        label: `#${c.id} - ${c.channel_code || '无渠道'} - ${c.bd_vid || c.ext_info || ''}`
      }));

    if (clickOptions.length === 0) {
      showToast('没有可回传的点击记录（需要有bd_vid或ext_info）', 'warning');
      return;
    }

    const typeOptions = Object.entries(this.conversionTypes).map(([value, typeInfo]) => ({
      value: parseInt(value),
      label: `${value} - ${typeof typeInfo === 'object' ? typeInfo.name : typeInfo}`
    }));

    EventBus.emit('modal:open', {
      title: '回传转化数据',
      formFields: [
        { name: 'clickId', label: '选择点击记录', type: 'select', options: clickOptions, required: true },
        { name: 'newType', label: '转化类型', type: 'select', options: typeOptions, value: 3, required: true },
        { name: 'convertValue', label: '转化金额(分)', type: 'number', placeholder: '选填，单位：分' },
        { name: 'attributeSource', label: '转化来源', type: 'select', value: 0, options: [
          { value: 0, label: '百度' },
          { value: 1, label: '自然流量' },
          { value: 2, label: '竞媒' }
        ]},
        { name: 'interactionsType', label: '归因方式', type: 'select', value: 1, options: [
          { value: 1, label: '点击' },
          { value: 2, label: '播放' },
          { value: 3, label: '关注' },
          { value: 4, label: '分享' },
          { value: 5, label: '点赞' },
          { value: 6, label: '曝光' }
        ]}
      ],
      onConfirm: async (data) => {
        const res = await api.post('/conversion/upload-from-click', data);
        if (res.code === 0) {
          if (res.data?.header?.status === 0) {
            showToast('回传成功');
          } else {
            showToast('回传完成，状态: ' + (res.data?.header?.desc || '未知'), 'warning');
          }
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  openMockUploadModal() {
    const clickOptions = this.clicks
      .filter(c => c.bd_vid || c.ext_info)
      .map(c => ({
        value: c.id,
        label: `#${c.id} - ${c.channel_code || '无渠道'} - ${c.bd_vid || c.ext_info || ''}`
      }));

    if (clickOptions.length === 0) {
      showToast('没有可回传的点击记录', 'warning');
      return;
    }

    const typeOptions = Object.entries(this.conversionTypes).map(([value, typeInfo]) => ({
      value: parseInt(value),
      label: `${value} - ${typeof typeInfo === 'object' ? typeInfo.name : typeInfo}`
    }));

    EventBus.emit('modal:open', {
      title: '模拟回传（测试）',
      formFields: [
        { name: 'clickId', label: '选择点击记录', type: 'select', options: clickOptions, required: true },
        { name: 'newType', label: '转化类型', type: 'select', options: typeOptions, value: 3, required: true }
      ],
      onConfirm: async (data) => {
        const click = this.clicks.find(c => c.id === parseInt(data.clickId));
        if (!click) return;

        let logidUrl = '';
        if (click.bd_vid) {
          logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?bd_vid=${click.bd_vid}`;
        } else if (click.ext_info) {
          logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?ext_info=${click.ext_info}`;
        }

        const res = await api.post('/conversion/mock-upload', {
          conversionTypes: [{
            logidUrl,
            newType: parseInt(data.newType)
          }]
        });

        if (res.code === 0) {
          showToast('模拟回传成功');
          this.loadData();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }

  async clearHistory() {
    if (!confirm('确定要清空所有回传历史吗？')) return;
    const res = await api.delete('/conversion/history');
    if (res.code === 0) {
      showToast('清空成功');
      this.loadData();
    } else {
      showToast(res.message, 'error');
    }
  }

  showDetail(record) {
    const content = `
      <div class="space-y-4 max-h-96 overflow-y-auto">
        <div>
          <h4 class="font-medium text-gray-700 mb-2">回传数据</h4>
          <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto">${JSON.stringify(record.conversionTypes, null, 2)}</pre>
        </div>
        <div>
          <h4 class="font-medium text-gray-700 mb-2">返回结果</h4>
          <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto">${JSON.stringify(record.result, null, 2)}</pre>
        </div>
      </div>
    `;

    EventBus.emit('modal:open', {
      title: `回传记录详情 #${record.id}`,
      content,
      onConfirm: () => {}
    });
  }

  getStatusBadge(result) {
    const status = result?.header?.status;
    if (status === 0) return '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">成功</span>';
    if (status === 1) return '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">部分成功</span>';
    if (status === 2) return '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">失败</span>';
    if (status === 3) return '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Token错误</span>';
    return '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">未知</span>';
  }

  renderCommonTypes() {
    // 常用转化类型ID
    const commonTypeIds = ['1', '2', '3', '4', '18', '25', '26', '27', '30', '35', '67', '79'];
    const types = this.conversionTypes;

    return commonTypeIds
      .filter(id => types[id])
      .slice(0, 8)
      .map(id => {
        const typeInfo = types[id];
        const name = typeof typeInfo === 'object' ? typeInfo.name : typeInfo;
        return `<span>${id} - ${name}</span>`;
      })
      .join('');
  }

  render() {
    const autoTypesDisplay = this.autoUploadConfig.types.map(t => {
      const typeInfo = this.conversionTypes[t];
      return typeInfo ? (typeof typeInfo === 'object' ? typeInfo.name : typeInfo) : t;
    }).join('、') || '未配置';

    this.innerHTML = `
      <div class="space-y-6">
        <!-- 配置卡片 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">API配置</h3>
            <button class="config-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              配置Token
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-500">API Token</label>
              <div class="flex items-center space-x-2">
                <span class="text-gray-800 font-mono text-sm">${this.config.token ? this.config.token.substring(0, 20) + '...' : '未配置'}</span>
                ${this.config.token ? `<button class="copy-token-btn text-blue-600 text-sm">复制</button>` : ''}
              </div>
            </div>
            <div>
              <label class="text-sm text-gray-500">API地址</label>
              <p class="text-gray-800 text-sm truncate">${this.config.apiUrl || 'https://ocpc.baidu.com/ocpcapi/api/uploadConvertData'}</p>
            </div>
          </div>
        </div>

        <!-- 自动回传配置卡片 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <h3 class="text-lg font-semibold text-gray-800">自动回传</h3>
              ${this.autoUploadConfig.enabled
                ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">已启用</span>'
                : '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">未启用</span>'}
            </div>
            <button class="auto-config-btn px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              配置自动回传
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label class="text-gray-500">自动回传类型</label>
              <p class="text-gray-800">${autoTypesDisplay}</p>
            </div>
            <div>
              <label class="text-gray-500">延迟时间</label>
              <p class="text-gray-800">${this.autoUploadConfig.delay > 0 ? this.autoUploadConfig.delay + '秒' : '立即回传'}</p>
            </div>
          </div>
          ${this.autoUploadConfig.enabled ? `
            <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <strong>提示：</strong>当用户访问落地页（如 /landing?bd_vid=xxx）时，系统将自动回传配置的转化类型到百度
            </div>
          ` : ''}
        </div>

        <!-- 操作按钮 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex flex-wrap gap-3">
            <button class="upload-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light flex items-center space-x-2 ${!this.config.token ? 'opacity-50 cursor-not-allowed' : ''}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <span>回传转化</span>
            </button>
            <button class="mock-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>模拟回传</span>
            </button>
            <button class="refresh-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              刷新
            </button>
            <button class="clear-btn px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ml-auto">
              清空历史
            </button>
          </div>
        </div>

        <!-- 转化类型说明 -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-2">常用转化类型</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
            ${this.renderCommonTypes()}
          </div>
        </div>

        <!-- 回传历史 -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-xl font-semibold text-gray-800">回传历史</h2>
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
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">回传数量</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">转化类型</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  ${this.history.length === 0 ? `
                    <tr>
                      <td colspan="6" class="px-4 py-8 text-center text-gray-500">暂无回传记录</td>
                    </tr>
                  ` : this.history.map(h => `
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm text-gray-900">
                        ${h.id}
                        ${h.isMock ? '<span class="ml-1 px-1 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">模拟</span>' : ''}
                        ${h.isAuto ? '<span class="ml-1 px-1 py-0.5 text-xs bg-purple-200 text-purple-700 rounded">自动</span>' : ''}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-900">${h.conversionTypes?.length || 0}条</td>
                      <td class="px-4 py-3 text-sm text-gray-600">
                        ${h.conversionTypes?.map(c => c.newType).join(', ') || '-'}
                      </td>
                      <td class="px-4 py-3">${this.getStatusBadge(h.result)}</td>
                      <td class="px-4 py-3 text-sm text-gray-600">${h.createTime ? new Date(h.createTime).toLocaleString() : '-'}</td>
                      <td class="px-4 py-3">
                        <button class="detail-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${h.id}">详情</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- 分页 -->
            ${this.pagination.totalPages > 1 ? `
              <div class="p-4 border-t flex items-center justify-between">
                <span class="text-sm text-gray-500">
                  共 ${this.pagination.total} 条记录，第 ${this.pagination.page}/${this.pagination.totalPages} 页
                </span>
                <div class="flex space-x-2">
                  <button class="prev-btn px-3 py-1 border rounded ${this.pagination.page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}"
                    ${this.pagination.page <= 1 ? 'disabled' : ''}>上一页</button>
                  <button class="next-btn px-3 py-1 border rounded ${this.pagination.page >= this.pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}"
                    ${this.pagination.page >= this.pagination.totalPages ? 'disabled' : ''}>下一页</button>
                </div>
              </div>
            ` : ''}
          `}
        </div>
      </div>
    `;

    // 绑定事件
    this.querySelector('.config-btn')?.addEventListener('click', () => this.openConfigModal());
    this.querySelector('.auto-config-btn')?.addEventListener('click', () => this.openAutoUploadConfigModal());
    this.querySelector('.upload-btn')?.addEventListener('click', () => {
      if (this.config.token) {
        this.openUploadModal();
      } else {
        showToast('请先配置API Token', 'warning');
      }
    });
    this.querySelector('.mock-btn')?.addEventListener('click', () => this.openMockUploadModal());
    this.querySelector('.refresh-btn')?.addEventListener('click', () => this.loadData());
    this.querySelector('.clear-btn')?.addEventListener('click', () => this.clearHistory());
    this.querySelector('.copy-token-btn')?.addEventListener('click', () => {
      this.copyToClipboard(this.config.token, 'Token已复制');
    });

    this.querySelector('.prev-btn')?.addEventListener('click', () => {
      if (this.pagination.page > 1) {
        this.pagination.page--;
        this.loadData();
      }
    });

    this.querySelector('.next-btn')?.addEventListener('click', () => {
      if (this.pagination.page < this.pagination.totalPages) {
        this.pagination.page++;
        this.loadData();
      }
    });

    this.querySelectorAll('.detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const record = this.history.find(h => h.id === parseInt(btn.dataset.id));
        if (record) this.showDetail(record);
      });
    });
  }
}

customElements.define('conversion-list', ConversionList);

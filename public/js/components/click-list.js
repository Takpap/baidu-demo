// 点击记录列表组件
class ClickList extends HTMLElement {
  constructor() {
    super();
    this.clicks = [];
    this.pagination = { page: 1, pageSize: 20, total: 0 };
    this.stats = null;
    this.loading = true;
    this.filters = {
      channel_code: '',
      pid: '',
      bd_vid: ''
    };
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();

    const params = new URLSearchParams({
      page: this.pagination.page,
      pageSize: this.pagination.pageSize
    });

    if (this.filters.channel_code) params.append('channel_code', this.filters.channel_code);
    if (this.filters.pid) params.append('pid', this.filters.pid);
    if (this.filters.bd_vid) params.append('bd_vid', this.filters.bd_vid);

    const [listRes, statsRes] = await Promise.all([
      api.get(`/click/list?${params.toString()}`),
      api.get('/click/stats')
    ]);

    if (listRes.code === 0) {
      this.clicks = listRes.data.list;
      this.pagination = listRes.data.pagination;
    }
    if (statsRes.code === 0) {
      this.stats = statsRes.data;
    }

    this.loading = false;
    this.render();
  }

  async clearClicks() {
    if (!confirm('确定要清空所有点击记录吗？此操作不可恢复！')) return;
    const res = await api.delete('/click/clear');
    if (res.code === 0) {
      showToast('清空成功');
      this.loadData();
    } else {
      showToast(res.message, 'error');
    }
  }

  showDetail(click) {
    const paramLabels = {
      channel_code: '渠道码',
      aid: '创意ID',
      pid: '计划ID',
      uid: '单元ID',
      useid: '用户ID',
      click_id: '点击ID',
      idfa: 'IDFA',
      imei_md5: 'IMEI MD5',
      androidid: '安卓ID',
      androidid_md5: '安卓ID MD5',
      ip: 'IP地址',
      ua: 'User Agent',
      os: '操作系统',
      ts: '时间戳',
      ext_info: '扩展信息',
      mac_md5: 'MAC MD5',
      mac: 'MAC地址',
      deeplink_url: '深度链接',
      bd_vid: '百度VID',
      recordTime: '记录时间',
      referer: '来源页面',
      realIp: '真实IP',
      realUa: '真实UA'
    };

    const content = Object.entries(click)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `
        <div class="flex py-2 border-b">
          <span class="w-32 text-gray-500 text-sm">${paramLabels[key] || key}</span>
          <span class="flex-1 text-sm break-all">${value || '-'}</span>
        </div>
      `).join('');

    EventBus.emit('modal:open', {
      title: `点击记录详情 #${click.id}`,
      content: `<div class="max-h-96 overflow-y-auto">${content}</div>`,
      onConfirm: () => {}
    });
  }

  render() {
    this.innerHTML = `
      <div class="space-y-6">
        <!-- 统计卡片 -->
        ${this.stats ? `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">总点击数</div>
              <div class="text-2xl font-bold text-baidu-blue">${this.stats.total}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">渠道数</div>
              <div class="text-2xl font-bold text-green-600">${Object.keys(this.stats.byChannel || {}).length}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">计划数</div>
              <div class="text-2xl font-bold text-purple-600">${Object.keys(this.stats.byPlan || {}).length}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">今日点击</div>
              <div class="text-2xl font-bold text-orange-600">${this.stats.byDate?.[new Date().toISOString().split('T')[0]] || 0}</div>
            </div>
          </div>
        ` : ''}

        <!-- 筛选和操作 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex flex-wrap items-center gap-4">
            <input type="text" placeholder="渠道码" class="filter-channel px-3 py-2 border rounded-lg w-48"
              value="${this.filters.channel_code}">
            <input type="text" placeholder="计划ID" class="filter-pid px-3 py-2 border rounded-lg w-32"
              value="${this.filters.pid}">
            <input type="text" placeholder="百度VID" class="filter-bdvid px-3 py-2 border rounded-lg w-48"
              value="${this.filters.bd_vid}">
            <button class="search-btn px-4 py-2 bg-baidu-blue text-white rounded-lg hover:bg-baidu-light">
              搜索
            </button>
            <button class="refresh-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              刷新
            </button>
            <button class="clear-btn px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ml-auto">
              清空记录
            </button>
          </div>
        </div>

        <!-- 监测链接说明 -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-2">监测链接接收地址</h4>
          <code class="text-sm text-blue-600 break-all">
            GET ${window.location.origin}/api/click/record?channel_code=xxx&aid=__IDEA_ID__&pid=__PLAN_ID__&...
          </code>
          <p class="text-sm text-blue-600 mt-2">将此地址配置到百度营销后台，系统会自动记录所有访问参数。</p>
        </div>

        <!-- 点击记录表格 -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-xl font-semibold text-gray-800">点击记录</h2>
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
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">渠道码</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">计划ID</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">单元ID</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">创意ID</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">点击ID</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">百度VID</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">IP</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">记录时间</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  ${this.clicks.length === 0 ? `
                    <tr>
                      <td colspan="10" class="px-4 py-8 text-center text-gray-500">暂无点击记录</td>
                    </tr>
                  ` : this.clicks.map(c => `
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm text-gray-900">${c.id}</td>
                      <td class="px-4 py-3 text-sm text-gray-600 max-w-32 truncate" title="${c.channel_code}">${c.channel_code || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-900">${c.pid || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-900">${c.uid || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-900">${c.aid || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-600 max-w-24 truncate" title="${c.click_id}">${c.click_id || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-600 max-w-24 truncate" title="${c.bd_vid}">${c.bd_vid || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-600">${c.ip || c.realIp || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-600">${c.recordTime ? new Date(c.recordTime).toLocaleString() : '-'}</td>
                      <td class="px-4 py-3">
                        <button class="detail-btn text-blue-600 hover:text-blue-800 text-sm" data-id="${c.id}">详情</button>
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
    this.querySelector('.search-btn')?.addEventListener('click', () => {
      this.filters.channel_code = this.querySelector('.filter-channel').value;
      this.filters.pid = this.querySelector('.filter-pid').value;
      this.filters.bd_vid = this.querySelector('.filter-bdvid').value;
      this.pagination.page = 1;
      this.loadData();
    });

    this.querySelector('.refresh-btn')?.addEventListener('click', () => this.loadData());
    this.querySelector('.clear-btn')?.addEventListener('click', () => this.clearClicks());

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
        const click = this.clicks.find(c => c.id === parseInt(btn.dataset.id));
        if (click) this.showDetail(click);
      });
    });
  }
}

customElements.define('click-list', ClickList);

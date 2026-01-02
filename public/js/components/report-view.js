// 数据报告组件
class ReportView extends HTMLElement {
  constructor() {
    super();
    this.reports = [];
    this.summary = null;
    this.campaigns = [];
    this.loading = true;
    this.selectedCampaign = '';
  }

  async connectedCallback() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.render();

    let reportUrl = '/report';
    let summaryUrl = '/report/summary';
    if (this.selectedCampaign) {
      reportUrl += `?campaignId=${this.selectedCampaign}`;
      summaryUrl += `?campaignId=${this.selectedCampaign}`;
    }

    const [reportRes, summaryRes, campaignRes] = await Promise.all([
      api.get(reportUrl),
      api.get(summaryUrl),
      api.get('/campaign')
    ]);

    if (reportRes.code === 0) this.reports = reportRes.data;
    if (summaryRes.code === 0) this.summary = summaryRes.data;
    if (campaignRes.code === 0) this.campaigns = campaignRes.data;

    this.loading = false;
    this.render();
  }

  getCampaignName(campaignId) {
    const campaign = this.campaigns.find(c => c.campaignId === campaignId);
    return campaign ? campaign.campaignName : '-';
  }

  render() {
    this.innerHTML = `
      <div class="space-y-6">
        <!-- 筛选器 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium text-gray-700">推广计划:</label>
            <select class="campaign-filter px-3 py-2 border rounded-lg focus:ring-2 focus:ring-baidu-blue">
              <option value="">全部计划</option>
              ${this.campaigns.map(c => `
                <option value="${c.campaignId}" ${this.selectedCampaign == c.campaignId ? 'selected' : ''}>${c.campaignName}</option>
              `).join('')}
            </select>
            <button class="refresh-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              刷新数据
            </button>
          </div>
        </div>

        <!-- 汇总卡片 -->
        ${this.summary ? `
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">展现量</div>
              <div class="text-2xl font-bold text-gray-900">${this.summary.impressions.toLocaleString()}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">点击量</div>
              <div class="text-2xl font-bold text-gray-900">${this.summary.clicks.toLocaleString()}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">消费</div>
              <div class="text-2xl font-bold text-orange-600">¥${this.summary.cost}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">转化数</div>
              <div class="text-2xl font-bold text-green-600">${this.summary.conversions}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">点击率</div>
              <div class="text-2xl font-bold text-blue-600">${this.summary.ctr}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">平均点击价格</div>
              <div class="text-2xl font-bold text-purple-600">¥${this.summary.cpc}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-sm text-gray-500 mb-1">转化率</div>
              <div class="text-2xl font-bold text-teal-600">${this.summary.cvr}</div>
            </div>
          </div>
        ` : ''}

        <!-- 详细数据表格 -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-xl font-semibold text-gray-800">详细数据</h2>
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
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">日期</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">推广计划</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">展现量</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">点击量</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">点击率</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">消费</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">平均点击价格</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">转化数</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  ${this.reports.length === 0 ? `
                    <tr>
                      <td colspan="8" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                    </tr>
                  ` : this.reports.map(r => {
                    const ctr = r.impressions > 0 ? (r.clicks / r.impressions * 100).toFixed(2) : 0;
                    const cpc = r.clicks > 0 ? (r.cost / r.clicks).toFixed(2) : 0;
                    return `
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-900">${r.date}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">${this.getCampaignName(r.campaignId)}</td>
                        <td class="px-4 py-3 text-sm text-gray-900 text-right">${r.impressions.toLocaleString()}</td>
                        <td class="px-4 py-3 text-sm text-gray-900 text-right">${r.clicks.toLocaleString()}</td>
                        <td class="px-4 py-3 text-sm text-blue-600 text-right">${ctr}%</td>
                        <td class="px-4 py-3 text-sm text-orange-600 text-right">¥${r.cost.toFixed(2)}</td>
                        <td class="px-4 py-3 text-sm text-purple-600 text-right">¥${cpc}</td>
                        <td class="px-4 py-3 text-sm text-green-600 text-right">${r.conversions}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    this.querySelector('.campaign-filter')?.addEventListener('change', (e) => {
      this.selectedCampaign = e.target.value;
      this.loadData();
    });

    this.querySelector('.refresh-btn')?.addEventListener('click', () => {
      this.loadData();
    });
  }
}

customElements.define('report-view', ReportView);

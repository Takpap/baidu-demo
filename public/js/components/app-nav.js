// 导航组件
class AppNav extends HTMLElement {
  static get observedAttributes() {
    return ['current'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const current = this.getAttribute('current') || 'campaign';
    const navItems = [
      { key: 'campaign', label: '推广计划' },
      { key: 'adgroup', label: '推广单元' },
      { key: 'keyword', label: '关键词' },
      { key: 'creative', label: '创意' },
      { key: 'tracking', label: '监测链接' },
      { key: 'promotion-url', label: '推广链接' },
      { key: 'click', label: '点击记录' },
      { key: 'report', label: '数据报告' }
    ];

    this.innerHTML = `
      <nav class="bg-baidu-blue shadow-lg">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center space-x-2">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.927 12.497c2.063-.443 1.782-2.909 1.72-3.448-.101-.83-.946-2.32-2.256-2.206-1.6.137-1.752 2.283-1.752 2.283s-.535 3.845 2.288 3.371zm3.088 3.479c-.064-.076-.168-.15-.168-.15-.734-.534-1.17-.857-1.512-1.418-.218-.354-.376-.799-.249-1.199.161-.514.631-.803 1.03-1.087.641-.456 1.32-.973 1.32-1.973 0-.936-.727-1.631-1.622-1.631-.896 0-1.623.695-1.623 1.631 0 .233.044.455.123.66-.947.22-1.658.95-1.658 1.972 0 1.498 1.168 2.715 2.608 2.715.588 0 1.132-.2 1.57-.52h.181zm7.985-3.479c2.063.443 2.288-3.371 2.288-3.371s-.152-2.146-1.752-2.283c-1.31-.114-2.155 1.376-2.256 2.206-.062.539-.343 3.005 1.72 3.448zm-4.91-5.028c1.26 0 2.281-1.57 2.281-3.506C14.371 1.927 13.35 0 12.09 0c-1.26 0-2.281 1.927-2.281 3.963 0 1.936 1.021 3.506 2.281 3.506zm4.49 5.028c-.947-.22-1.658-.95-1.658-1.972 0-.233.044-.455.123-.66-.896 0-1.623-.695-1.623-1.631 0-.936.727-1.631 1.623-1.631.895 0 1.622.695 1.622 1.631 0 1 .679 1.517 1.32 1.973.399.284.869.573 1.03 1.087.127.4-.031.845-.249 1.199-.342.561-.778.884-1.512 1.418 0 0-.104.074-.168.15h.181c.438.32.982.52 1.57.52 1.44 0 2.608-1.217 2.608-2.715 0-1.022-.711-1.752-1.658-1.972.079-.205.123-.427.123-.66 0-.936-.727-1.631-1.623-1.631-.895 0-1.622.695-1.622 1.631 0 1-.679 1.517-1.32 1.973-.399.284-.869.573-1.03 1.087z"/>
              </svg>
              <span class="text-white text-xl font-bold">百度营销平台</span>
              <span class="text-blue-200 text-sm ml-2">模拟系统</span>
            </div>
          </div>
          <div class="flex space-x-1 pb-2 overflow-x-auto">
            ${navItems.map(item => `
              <button
                class="nav-btn px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${current === item.key
                    ? 'bg-white text-baidu-blue'
                    : 'text-white hover:bg-white/10'}"
                data-page="${item.key}"
              >
                ${item.label}
              </button>
            `).join('')}
          </div>
        </div>
      </nav>
    `;

    this.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        EventBus.emit('navigate', btn.dataset.page);
      });
    });
  }
}

customElements.define('app-nav', AppNav);

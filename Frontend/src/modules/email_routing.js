export class EmailRoutingModule {
  static render(container, state) {
    container.innerHTML = `
      <div class="page-header d-print-none mb-3">
        <div class="row align-items-center">
          <div class="col">
            <div class="page-pretitle text-muted">Core Function</div>
            <h2 class="page-title fw-bold">邮件路由 (Email Routing)</h2>
          </div>
        </div>
      </div>
      <div class="row row-cards">
        <div class="col-md-5">
          <div class="card border-0 shadow-sm rounded-3 h-100">
            <div class="card-body">
              <h3 class="card-title fw-bold border-bottom pb-2">操作配置</h3>
              <div class="mb-3">
                <label class="form-label fw-bold">选择 Cloudflare 账号</label>
                <select id="email-acc-id" class="form-select border-2 shadow-none">
                  ${(window.accountsCache || []).map(a => `<option value="${a.id}">${a.name} (${a.email})</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Worker 名称</label>
                <input type="text" id="email-worker-name" class="form-control border-2 shadow-none" placeholder="msmail-email-receiver-worker" value="msmail-email-receiver-worker">
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">输入域名列表 <span class="badge bg-blue-lt">每行一个</span></label>
                <textarea id="email-domains" class="form-control border-2 shadow-none" rows="12" placeholder="example.com\nexample.net"></textarea>
              </div>
              <div class="form-footer mt-4">
                <div class="row g-2">
                  <div class="col-6">
                    <button id="btn-email-routing" class="btn btn-primary w-100 py-2 fw-bold shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-mail-fast" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7l9 6l9 -6" /><path d="M5 11h14v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7z" /><path d="M11 3l2 4l-2 4" /></svg>
                      开启邮件路由
                    </button>
                  </div>
                  <div class="col-6">
                    <button id="btn-email-delete" class="btn btn-danger-lt w-100 py-2 fw-bold shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                      停用邮件路由
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card border-0 shadow-sm rounded-3 h-100">
            <div class="card-body">
              <h3 class="card-title fw-bold border-bottom pb-2">处理结果反馈</h3>
              <div id="email-results" class="table-responsive mt-2">
                <div class="text-center py-6 text-muted border-0">配置左侧信息后点击开始，结果将显示在此处</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-email-routing').addEventListener('click', () => this.batchEmailRouting(state));
    document.getElementById('btn-email-delete').addEventListener('click', () => this.batchDeleteEmailRouting(state));
  }

  static async batchEmailRouting(state) {
    const accId = document.getElementById('email-acc-id').value;
    const worker = document.getElementById('email-worker-name').value;
    const domainsText = document.getElementById('email-domains').value || '';

    if (!accId || !worker || !domainsText.trim()) return alert('请选择账号并输入 Worker 名称和域名列表');

    let domains = domainsText.split('\n').map(d => d.trim()).filter(d => d.length > 0);
    domains = [...new Set(domains)];

    if (domains.length === 0) return alert('域名列表为空或格式不正确');

    const btn = document.getElementById('btn-email-routing');
    const resultsDiv = document.getElementById('email-results');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>正在请求中...';
    resultsDiv.innerHTML = `
      <table class="table table-vcenter card-table table-hover">
        <thead class="bg-light">
          <tr><th>域名</th><th>状态</th><th>返回消息</th></tr>
        </thead>
        <tbody>
          ${domains.map(d => `<tr><td>${d}</td><td><span class="badge bg-secondary-lt text-dark">队列中</span></td><td>-</td></tr>`).join('')}
        </tbody>
      </table>
    `;

    try {
      const res = await fetch('/api/email/batch-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': state.token || localStorage.getItem('token') },
        body: JSON.stringify({ accountId: accId, domains, worker })
      });
      const data = await res.json();

      resultsDiv.innerHTML = `
        <table class="table table-vcenter card-table table-hover">
          <thead class="bg-light">
            <tr><th>域名</th><th>状态</th><th>返回消息</th></tr>
          </thead>
          <tbody>
            ${data.map(r => `
              <tr class="bg-white">
                <td><div class="fw-bold text-dark">${r.domain}</div></td>
                <td>${r.success ? '<span class="badge bg-success-lt text-success fw-bold">成功</span>' : '<span class="badge bg-danger-lt text-danger fw-bold">失败</span>'}</td>
                <td><span class="${r.success ? 'text-muted' : 'text-danger'} small">${r.message}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      console.error(e);
      alert('提交请求发生错误，请看控制台');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-mail-fast" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7l9 6l9 -6" /><path d="M5 11h14v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7z" /><path d="M11 3l2 4l-2 4" /></svg> 开启邮件路由';
    }
  }

  static async batchDeleteEmailRouting(state) {
    const acc_id = document.getElementById('email-acc-id').value;
    const domains_text = document.getElementById('email-domains').value || '';
    if (!acc_id || !domains_text.trim()) return alert('请选择账号并输入域名列表');
    let domains = domains_text.split('\n').map(d => d.trim()).filter(d => d.length > 0);
    domains = [...new Set(domains)];
    if (domains.length === 0) return alert('域名列表为空');
    const btn = document.getElementById('btn-email-delete');
    const results_div = document.getElementById('email-results');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>正在请求中...';
    results_div.innerHTML = `
      <table class="table table-vcenter card-table table-hover">
        <thead class="bg-light">
          <tr><th>域名</th><th>状态</th><th>返回消息</th></tr>
        </thead>
        <tbody>
          ${domains.map(d => `<tr><td>${d}</td><td><span class="badge bg-secondary-lt text-dark">队列中</span></td><td>-</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    try {
      const res = await fetch('/api/email/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': state.token || localStorage.getItem('token') },
        body: JSON.stringify({ accountId: acc_id, domains })
      });
      const data = await res.json();
      results_div.innerHTML = `
        <table class="table table-vcenter card-table table-hover">
          <thead class="bg-light">
            <tr><th>域名</th><th>状态</th><th>返回消息</th></tr>
          </thead>
          <tbody>
            ${data.map(r => `
              <tr class="bg-white">
                <td><div class="fw-bold text-dark">${r.domain}</div></td>
                <td>${r.success ? '<span class="badge bg-success-lt text-success fw-bold">成功</span>' : '<span class="badge bg-danger-lt text-danger fw-bold">失败</span>'}</td>
                <td><span class="${r.success ? 'text-muted' : 'text-danger'} small">${r.message}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      console.error(e);
      alert('提交停用请求发生错误');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg> 停用邮件路由';
    }
  }
}

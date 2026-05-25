export class DNSRecordsModule {
  static async render(container, state) {
    const res = await fetch('/api/accounts', { headers: { 'Authorization': state.token || localStorage.getItem('token') } });
    if (!res.ok) {
      window.logout();
      return;
    }
    const accounts = await res.json();

    container.innerHTML = `
      <div class="page-header d-print-none mb-3">
        <div class="row align-items-center">
          <div class="col">
            <div class="page-pretitle text-muted">DNS Management</div>
            <h2 class="page-title fw-bold">批量域名解析 (Batch DNS Records)</h2>
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
                <select id="dns-account" class="form-select border-2 shadow-none">
                  ${(accounts || []).map(a => `<option value="${a.id}">${a.name} (${a.email})</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">输入解析记录 <span class="badge bg-blue-lt">每行一个</span></label>
                <textarea id="dns-records" class="form-control border-2 shadow-none font-monospace" rows="8" placeholder="example.com|@|A|123.123.123.123"></textarea>
                <div class="bg-light border rounded p-2 mt-2">
                  <div class="fw-bold small text-dark mb-1">格式：域名|主机记录|记录类型|记录值</div>
                  <div class="small text-primary" style="line-height: 1.6;">
                    <div>例如1：example.com|@|A|123.123.123.123</div>
                    <div>例如2：example.com|*|CNAME|www.example.org</div>
                    <div>例如3：example.com|www|A|44.55.123.111</div>
                    <div>例如4：example.com|www,m,@|A|44.55.123.111</div>
                    <div>例如5：example.com|@|MX|mail.example.com|5</div>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">TTL</label>
                <select id="dns-ttl" class="form-select border-2 shadow-none">
                  <option value="1">自动</option>
                  <option value="60">60</option>
                  <option value="120">120</option>
                  <option value="300">300</option>
                  <option value="600">600</option>
                  <option value="1800">1800</option>
                  <option value="3600">3600</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">其他选项</label>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="dns-proxy">
                  <label class="form-check-label" for="dns-proxy">
                    开启代理
                  </label>
                </div>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="dns-delete-old">
                  <label class="form-check-label" for="dns-delete-old">
                    删除原解析
                  </label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="dns-offline">
                  <label class="form-check-label" for="dns-offline">
                    高线模式
                  </label>
                </div>
              </div>
              <div class="form-footer mt-4">
                <button id="btn-start-parse" class="btn btn-primary w-100 py-2 fw-bold shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-rocket" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3" /><path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3" /><path d="M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                  立即批量解析
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card border-0 shadow-sm rounded-3 h-100">
            <div class="card-body">
              <h3 class="card-title fw-bold border-bottom pb-2">解析结果反馈</h3>
              <div id="dns-results" class="table-responsive mt-2">
                <div class="text-center py-6 text-muted border-0">配置左侧信息后点击开始，结果将显示在此处</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-start-parse').addEventListener('click', () => this.startParse(state));
  }

  static async startParse(state) {
    const accountId = document.getElementById('dns-account').value;
    const recordsText = document.getElementById('dns-records').value || '';
    const ttl = parseInt(document.getElementById('dns-ttl').value);
    const proxied = document.getElementById('dns-proxy').checked;
    const deleteOld = document.getElementById('dns-delete-old').checked;
    const offlineMode = document.getElementById('dns-offline').checked;

    if (!accountId) return alert('请选择操作账号');
    if (!recordsText.trim()) return alert('请输入域名解析记录');

    const records = recordsText.split('\n').map(r => r.trim()).filter(r => r.length > 0);
    if (records.length === 0) return alert('域名记录列表为空');

    const btn = document.getElementById('btn-start-parse');
    const resultsDiv = document.getElementById('dns-results');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>正在解析中...';

    const parsedRecords = records.map(r => {
      const parts = r.split('|');
      const val = parts[3] || '';
      const show_val = parts[4] ? val + ' [优先级: ' + parts[4] + ']' : val;
      return {
        domain: parts[0] || '',
        host: parts[1] || '@',
        type: parts[2] || 'A',
        value: show_val
      };
    });

    resultsDiv.innerHTML = `
      <table class="table table-vcenter card-table table-hover">
        <thead class="bg-light">
          <tr><th>域名</th><th>主机记录</th><th>记录类型</th><th>记录值</th><th>状态</th></tr>
        </thead>
        <tbody>
          ${parsedRecords.map(r => `<tr><td>${r.domain}</td><td><code class="text-primary">${r.host}</code></td><td><span class="badge bg-blue-lt">${r.type}</span></td><td class="font-monospace small">${r.value}</td><td><span class="badge bg-secondary-lt text-dark">队列中</span></td></tr>`).join('')}
        </tbody>
      </table>
    `;

    try {
      const res = await fetch('/api/dns/batch-parse', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': state.token || localStorage.getItem('token') 
        },
        body: JSON.stringify({ 
          accountId, 
          records, 
          ttl, 
          proxied, 
          deleteOld, 
          offlineMode 
        })
      });

      const data = await res.json();

      resultsDiv.innerHTML = `
        <table class="table table-vcenter card-table table-hover">
          <thead class="bg-light">
            <tr><th>域名</th><th>主机记录</th><th>记录类型</th><th>记录值</th><th>状态</th></tr>
          </thead>
          <tbody>
            ${data.map(r => `
              <tr class="bg-white">
                <td><div class="fw-bold text-dark">${r.domain}</div></td>
                <td><code class="text-primary">${r.host}</code></td>
                <td><span class="badge bg-blue-lt">${r.type}</span></td>
                <td class="font-monospace small text-muted">${r.value}</td>
                <td>
                  ${r.success 
                    ? '<span class="badge bg-success-lt text-success fw-bold">成功</span>' 
                    : `<span class="badge bg-danger-lt text-danger fw-bold">失败</span><div class="small text-danger mt-1">${r.message}</div>`
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      console.error(e);
      alert('提交请求发生错误');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 4v16l13 -8z" /></svg> 开始解析';
    }
  }
}

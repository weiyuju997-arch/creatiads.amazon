/* Ad Studio · Facebook 合创广告（独立页，可被外壳 iframe 嵌入） */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // tabs
  $$('.ads-tab').forEach((t) => {
    t.addEventListener('click', () => {
      $$('.ads-tab').forEach((i) => i.classList.remove('active'));
      t.classList.add('active');
    });
  });

  // 顶部返回（嵌在 iframe 时通知父页）
  $('#adsBack')?.addEventListener('click', () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'ad-studio-back' }, '*');
    } else {
      history.back();
    }
  });

  // 添加广告变体行
  $('#addVariantRow')?.addEventListener('click', () => {
    const tbody = $('#adVariantBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="账户ID" /></td>
      <td><input value="" placeholder="C00X" /></td>
      <td><input value="" placeholder="内容名" /></td>
      <td><input value="" placeholder="TRK00X" /></td>
      <td><input value="" placeholder="模板" /></td>
      <td><button class="ads-row-del" type="button">×</button></td>
    `;
    tbody.appendChild(tr);
    bindVariantRows();
    refreshPreview();
  });

  function bindVariantRows() {
    $$('#adVariantBody .ads-row-del').forEach((b) => {
      b.onclick = () => {
        const rows = $$('#adVariantBody tr');
        if (rows.length <= 1) return;
        b.closest('tr').remove();
        refreshPreview();
      };
    });
    $$('#adVariantBody input').forEach((i) => (i.oninput = refreshPreview));
  }

  function refreshPreview() {
    const rows = $$('#adVariantBody tr');
    const advCount = new Set(rows.map((r) => r.querySelector('input')?.value).filter(Boolean)).size;
    const adCount = rows.length;
    $('#advCount').textContent = String(advCount);
    $('#adCount').textContent = String(adCount);
    $('#adCountText').textContent = `${adCount} 个广告`;
  }

  // 提交（mock）
  $('#btnSubmit')?.addEventListener('click', () => {
    alert('已提交（demo 占位，未对接真实接口）');
  });

  bindVariantRows();
  refreshPreview();
})();

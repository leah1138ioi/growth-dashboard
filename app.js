/**
 * 个人成长工作台 - 核心逻辑
 * 功能：数据持久化、每日日程自动生成、模式切换、导入导出
 */

// ========== 数据存储 ==========
const STORAGE_KEY = 'growth_dashboard_data';
const SETTINGS_KEY = 'growth_dashboard_settings';

function getDefaultData() {
  return {
    headerDate: '2026年7月',
    monthTag: '____年__月',
    weekTag: '第___周 · __月__日-__日',
    currentMode: 'full',
    lastUpdate: new Date().toISOString()
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return getDefaultData();
}

function saveData() {
  const data = loadData();
  // 收集所有 contenteditable 内容
  document.querySelectorAll('[contenteditable="true"]').forEach(function(el, i) {
    data['editable_' + i] = el.innerHTML;
  });
  // 收集复选框状态
  document.querySelectorAll('.check-box').forEach(function(el, i) {
    data['check_' + i] = el.classList.contains('checked');
  });
  // 收集模式
  data.currentMode = currentMode;
  data.lastUpdate = new Date().toISOString();
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateSaveStatus('已保存 ' + new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}));
}

function restoreData() {
  const data = loadData();
  document.querySelectorAll('[contenteditable="true"]').forEach(function(el, i) {
    if (data['editable_' + i] !== undefined) {
      el.innerHTML = data['editable_' + i];
    }
  });
  document.querySelectorAll('.check-box').forEach(function(el, i) {
    if (data['check_' + i]) {
      el.classList.add('checked');
    }
  });
  if (data.currentMode) {
    selectMode(data.currentMode, true);
  }
  if (data.headerDate) {
    document.getElementById('headerDate').innerHTML = data.headerDate;
  }
  if (data.monthTag) {
    document.getElementById('monthTag').innerHTML = data.monthTag;
  }
  if (data.weekTag) {
    document.getElementById('weekTag').innerHTML = data.weekTag;
  }
}

// ========== 自动保存 ==========
let saveTimeout;
function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveData, 1500);
}

function updateSaveStatus(msg) {
  const el = document.getElementById('saveStatus');
  if (el) el.textContent = msg;
}

// 监听所有可编辑元素
document.addEventListener('input', function(e) {
  if (e.target.isContentEditable) {
    autoSave();
    updateSaveStatus('编辑中...');
  }
});

// 监听复选框点击
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('check-box')) {
    autoSave();
  }
});

// ========== 模式切换 ==========
let currentMode = 'full';

function selectMode(mode, silent) {
  currentMode = mode;
  
  // 隐藏所有模式
  document.getElementById('modeFull').style.display = 'none';
  document.getElementById('modeMin').style.display = 'none';
  document.getElementById('modeWeekend').style.display = 'none';
  
  // 显示选中模式
  if (mode === 'full') document.getElementById('modeFull').style.display = '';
  else if (mode === 'min') document.getElementById('modeMin').style.display = '';
  else if (mode === 'weekend') document.getElementById('modeWeekend').style.display = '';
  
  // 更新按钮状态
  document.querySelectorAll('.mode-btn').forEach(function(btn, i) {
    btn.classList.remove('selected');
    if (i === 0 && mode === 'full') btn.classList.add('selected');
    if (i === 1 && mode === 'min') btn.classList.add('selected');
    if (i === 2 && mode === 'weekend') btn.classList.add('selected');
  });
  
  if (!silent) {
    autoSave();
    showToast('已切换至：' + (mode === 'full' ? '工作日完整版' : mode === 'min' ? '最低容错版' : '周末聚会版'));
  }
}

// ========== 每日日程自动生成 ==========
function generateTodaySchedule() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=周日, 6=周六
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
  
  // 自动选择模式
  if (isWeekend) {
    selectMode('weekend');
  } else {
    selectMode('full');
  }
  
  // 滚动到板块4
  document.getElementById('p4').scrollIntoView({ behavior: 'smooth' });
  
  // 更新提示
  const dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
  const todayStr = dayNames[dayOfWeek];
  document.getElementById('todayName').textContent = todayStr;
  
  const hintEl = document.getElementById('modeHint');
  if (isWeekend) {
    hintEl.innerHTML = '<strong>🏖️ 周末模式已激活：</strong>今天是' + todayStr + '，任务减半，允许聚会。已自动切换至周末聚会容错版。';
  } else {
    hintEl.innerHTML = '<strong>📋 工作日模式：</strong>今天是' + todayStr + '，默认使用完整版。如状态不佳请手动切换至最低容错版。';
  }
  
  // 更新顶部提示
  const todayHint = document.getElementById('todayHint');
  if (isWeekend) {
    todayHint.textContent = '🏖️ 今天是' + todayStr + '，周末任务减半，记得放松！';
  } else {
    todayHint.textContent = '📋 今天是' + todayStr + '，工作日加油！状态差可切换最低容错版。';
  }
  
  // 更新日期标签
  const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + todayStr;
  document.getElementById('headerDate').innerHTML = dateStr;
  
  autoSave();
  showToast('✅ 今日日程已生成 — ' + (isWeekend ? '周末聚会版' : '工作日完整版'));
}

// ========== Toast 提示 ==========
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}

// ========== 数据导出 ==========
function exportData() {
  const data = loadData();
  // 重新收集最新数据
  document.querySelectorAll('[contenteditable="true"]').forEach(function(el, i) {
    data['editable_' + i] = el.innerHTML;
  });
  document.querySelectorAll('.check-box').forEach(function(el, i) {
    data['check_' + i] = el.classList.contains('checked');
  });
  data.currentMode = currentMode;
  data.lastUpdate = new Date().toISOString();
  data.exportDate = new Date().toLocaleString('zh-CN');
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '成长工作台备份_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 数据已导出');
}

// ========== 数据导入 ==========
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      restoreData();
      showToast('📥 数据已导入并恢复');
    } catch(err) {
      showToast('❌ 导入失败，文件格式不正确');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ========== 侧边栏激活状态 ==========
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  const mobileLinks = document.querySelectorAll('.mobile-nav a');
  
  let current = '';
  sections.forEach(function(section) {
    const top = section.getBoundingClientRect().top;
    if (top < 200) current = section.id;
  });
  
  navLinks.forEach(function(link) {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) link.classList.add('active');
  });
  mobileLinks.forEach(function(link) {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) link.classList.add('active');
  });
}

// ========== 移动端导航 ==========
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
}

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
}

// ========== 初始化 ==========
function init() {
  // 恢复数据
  restoreData();
  
  // 设置今天日期
  const now = new Date();
  const dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
  const todayStr = dayNames[now.getDay()];
  document.getElementById('todayName').textContent = todayStr;
  
  const isWeekend = (now.getDay() === 0 || now.getDay() === 6);
  const todayHint = document.getElementById('todayHint');
  if (isWeekend) {
    todayHint.textContent = '🏖️ 今天是' + todayStr + '，周末任务减半，记得放松！';
  } else {
    todayHint.textContent = '📋 今天是' + todayStr + '，工作日加油！状态差可切换最低容错版。';
  }
  
  // 更新最后更新日期
  const lastUpdate = loadData().lastUpdate;
  if (lastUpdate) {
    const d = new Date(lastUpdate);
    document.getElementById('lastUpdate').textContent = 
      d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日 ' +
      d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }
  
  // 滚动监听更新导航
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();
  
  // 点击侧边栏外部关闭移动导航
  document.addEventListener('click', function(e) {
    const mobileNav = document.getElementById('mobileNav');
    const menuBtn = document.getElementById('menuBtn');
    if (mobileNav.classList.contains('open') && 
        !mobileNav.contains(e.target) && 
        e.target !== menuBtn) {
      closeMobileNav();
    }
  });
  
  updateSaveStatus('就绪');
}

// 启动
document.addEventListener('DOMContentLoaded', init);

// 定期自动保存（每30秒）
setInterval(function() {
  saveData();
}, 30000);

// 页面离开前保存
window.addEventListener('beforeunload', saveData);
window.addEventListener('pagehide', saveData);

// 全局暴露函数
window.saveAllData = saveData;
window.exportData = exportData;
window.importData = importData;
window.generateTodaySchedule = generateTodaySchedule;
window.selectMode = selectMode;
window.toggleMobileNav = toggleMobileNav;
window.closeMobileNav = closeMobileNav;

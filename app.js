(function () {
  'use strict';

  // localStorage 的儲存鍵名
  var STORAGE_KEY = 'todo-app-items';
  var THEME_KEY = 'todo-app-theme';

  // 各篩選條件下,清單為空時的提示文字
  var EMPTY_MESSAGES = {
    all: '還沒有任何待辦事項,新增一個吧!',
    active: '太棒了,沒有未完成的事項!',
    completed: '還沒有已完成的事項。'
  };

  // 取得 DOM 元素
  var form = document.getElementById('todo-form');
  var input = document.getElementById('todo-input');
  var listEl = document.getElementById('todo-list');
  var emptyHint = document.getElementById('empty-hint');
  var remainingEl = document.getElementById('remaining-count');
  var themeBtn = document.getElementById('theme-toggle');
  var filterBtns = document.querySelectorAll('.btn-filter');

  // 待辦資料:[{ id, text, done }]
  var todos = loadTodos();

  // 目前的篩選條件:all / active / completed
  var currentFilter = 'all';

  // ---------- 深色模式 ----------

  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // 讀取使用者手動選擇的主題,從未選擇過則回傳 null
  function getStoredTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (e) {
      return null;
    }
  }

  // 目前生效的主題:優先使用手動選擇,否則跟隨作業系統
  function getEffectiveTheme() {
    return getStoredTheme() || (darkQuery.matches ? 'dark' : 'light');
  }

  // 套用主題並更新切換按鈕的圖示與文字
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'dark' ? '☀️ 淺色模式' : '🌙 深色模式';
  }

  // 點擊按鈕切換主題,並記住使用者的選擇
  themeBtn.addEventListener('click', function () {
    var next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      // 儲存失敗時仍可在本次瀏覽中切換
    }
    applyTheme(next);
  });

  // 尚未手動選擇時,作業系統設定改變就同步更新
  function onSystemThemeChange() {
    if (!getStoredTheme()) applyTheme(getEffectiveTheme());
  }
  if (darkQuery.addEventListener) {
    darkQuery.addEventListener('change', onSystemThemeChange);
  } else if (darkQuery.addListener) {
    darkQuery.addListener(onSystemThemeChange);
  }

  applyTheme(getEffectiveTheme());

  // ---------- 待辦資料 ----------

  // 從 localStorage 讀取資料,格式錯誤時回傳空陣列
  function loadTodos() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  // 將資料寫入 localStorage
  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      // 儲存失敗(例如隱私模式)時忽略,不影響畫面操作
    }
  }

  // 重新繪製整個畫面
  function render() {
    listEl.innerHTML = '';

    // 依篩選條件取出要顯示的項目
    var visible = todos.filter(function (t) {
      if (currentFilter === 'active') return !t.done;
      if (currentFilter === 'completed') return t.done;
      return true;
    });

    visible.forEach(function (todo) {
      var li = document.createElement('li');
      li.className = 'todo-item' + (todo.done ? ' done' : '');

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-check';
      checkbox.checked = todo.done;
      checkbox.setAttribute('aria-label', '標記完成');
      checkbox.addEventListener('change', function () {
        toggleTodo(todo.id);
      });

      // 使用 textContent 避免 XSS
      var text = document.createElement('span');
      text.className = 'todo-text';
      text.textContent = todo.text;

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-delete';
      delBtn.textContent = '刪除';
      delBtn.setAttribute('aria-label', '刪除:' + todo.text);
      delBtn.addEventListener('click', function () {
        deleteTodo(todo.id);
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(delBtn);
      listEl.appendChild(li);
    });

    // 顯示的清單為空時,依篩選條件顯示對應提示
    emptyHint.textContent = EMPTY_MESSAGES[currentFilter];
    emptyHint.hidden = visible.length > 0;

    // 更新篩選按鈕的選中狀態
    filterBtns.forEach(function (btn) {
      var isActive = btn.getAttribute('data-filter') === currentFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // 未完成數量以整體資料計算,不受篩選影響
    var remaining = todos.filter(function (t) { return !t.done; }).length;
    remainingEl.textContent = '未完成:' + remaining + ' 項';
  }

  // 切換篩選條件
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentFilter = btn.getAttribute('data-filter');
      render();
    });
  });

  // 新增待辦
  function addTodo(text) {
    todos.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      text: text,
      done: false
    });
    saveTodos();
    // 在「已完成」篩選下新增時,切回「全部」才看得到新項目
    if (currentFilter === 'completed') currentFilter = 'all';
    render();
  }

  // 切換完成狀態
  function toggleTodo(id) {
    todos.forEach(function (t) {
      if (t.id === id) t.done = !t.done;
    });
    saveTodos();
    render();
  }

  // 刪除待辦
  function deleteTodo(id) {
    todos = todos.filter(function (t) { return t.id !== id; });
    saveTodos();
    render();
  }

  // 表單送出(按鈕或 Enter)
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();

    // 空白內容不新增
    if (!text) {
      input.value = '';
      input.focus();
      return;
    }

    addTodo(text);
    input.value = '';
    input.focus();
  });

  // 初始化
  render();
})();

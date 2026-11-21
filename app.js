(function () {
  'use strict';

  // localStorage 的儲存鍵名
  var STORAGE_KEY = 'todo-app-items';

  // 取得 DOM 元素
  var form = document.getElementById('todo-form');
  var input = document.getElementById('todo-input');
  var listEl = document.getElementById('todo-list');
  var emptyHint = document.getElementById('empty-hint');
  var remainingEl = document.getElementById('remaining-count');

  // 待辦資料:[{ id, text, done }]
  var todos = loadTodos();

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

    todos.forEach(function (todo) {
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

    // 清單為空時顯示提示
    emptyHint.hidden = todos.length > 0;

    // 更新未完成數量
    var remaining = todos.filter(function (t) { return !t.done; }).length;
    remainingEl.textContent = '未完成:' + remaining + ' 項';
  }

  // 新增待辦
  function addTodo(text) {
    todos.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      text: text,
      done: false
    });
    saveTodos();
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

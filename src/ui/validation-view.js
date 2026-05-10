export function renderValidation(container, messages = []) {
  container.innerHTML = '';
  if (messages.length === 0) {
    container.className = 'validation-view ok';
    container.textContent = '校验通过';
    return;
  }

  container.className = 'validation-view error';
  const list = document.createElement('ul');
  for (const message of messages) {
    const item = document.createElement('li');
    item.textContent = typeof message === 'string' ? message : `第 ${message.lineNumber} 行：${message.reason}`;
    list.appendChild(item);
  }
  container.appendChild(list);
}

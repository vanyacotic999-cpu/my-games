// ============================================
// СИСТЕМА АККАУНТОВ С ПАРОЛЯМИ
// ============================================

(function() {
  const KEYS = {
    accounts: 'all_accounts',
    activeAccount: 'active_account'
  };

  function prefixKey(key) {
    const acc = getActiveAccount();
    return 'acc_' + acc + '_' + key;
  }

  // === СПИСОК АККАУНТОВ ===
  function getAllAccounts() {
    try {
      let list = JSON.parse(localStorage.getItem(KEYS.accounts) || '[]');

      if (list.length > 0 && typeof list[0] === 'string') {
        list = list.map(name => ({ name: name, password: '', isGuest: name === 'Гость' }));
        saveAccounts(list);
      }

      if (list.length === 0) {
        list.push({ name: 'Гость', password: '', isGuest: true });
        saveAccounts(list);
        localStorage.setItem(KEYS.activeAccount, 'Гость');
      }

      return list;
    } catch (e) {
      return [{ name: 'Гость', password: '', isGuest: true }];
    }
  }

  function saveAccounts(list) {
    localStorage.setItem(KEYS.accounts, JSON.stringify(list));
  }

  function getAccountNames() {
    return getAllAccounts().map(a => a.name);
  }

  function findAccount(name) {
    return getAllAccounts().find(a => a.name === name) || null;
  }

  function getActiveAccount() {
    let acc = localStorage.getItem(KEYS.activeAccount);
    const list = getAllAccounts();
    if (!acc || !list.find(a => a.name === acc)) {
      acc = list[0].name;
      localStorage.setItem(KEYS.activeAccount, acc);
    }
    return acc;
  }

  function setActiveAccount(name) {
    const acc = findAccount(name);
    if (acc) {
      localStorage.setItem(KEYS.activeAccount, name);
      return true;
    }
    return false;
  }

  function checkPassword(name, password) {
    const acc = findAccount(name);
    if (!acc) return { ok: false, msg: 'Аккаунт не найден' };
    if (acc.isGuest) return { ok: true };
    if (!acc.password) return { ok: true };
    if (acc.password === password) return { ok: true };
    return { ok: false, msg: 'Неверный пароль' };
  }

  function createAccount(name, password, isGuest) {
    name = (name || '').trim();
    if (!name) return { ok: false, msg: 'Введи имя' };
    if (name.length > 15) return { ok: false, msg: 'Максимум 15 символов' };
    if (name === 'Гость') return { ok: false, msg: 'Имя «Гость» занято' };

    const list = getAllAccounts();
    if (list.find(a => a.name === name)) {
      return { ok: false, msg: 'Такое имя уже есть' };
    }

    if (!isGuest && !password) {
      return { ok: false, msg: 'Введи пароль' };
    }

    if (password && password.length < 3) {
      return { ok: false, msg: 'Пароль слишком короткий (мин. 3)' };
    }

    list.push({
      name: name,
      password: isGuest ? '' : password,
      isGuest: !!isGuest
    });
    saveAccounts(list);
    return { ok: true, name: name };
  }

  function changePassword(name, oldPass, newPass) {
    const acc = findAccount(name);
    if (!acc) return { ok: false, msg: 'Аккаунт не найден' };
    if (acc.isGuest) return { ok: false, msg: 'У Гостя нет пароля' };

    if (acc.password !== oldPass) return { ok: false, msg: 'Неверный текущий пароль' };
    if (!newPass || newPass.length < 3) return { ok: false, msg: 'Новый пароль слишком короткий' };

    const list = getAllAccounts();
    const target = list.find(a => a.name === name);
    target.password = newPass;
    saveAccounts(list);
    return { ok: true };
  }

  // === УДАЛЕНИЕ С ПРОВЕРКОЙ ПАРОЛЯ ===
  function deleteAccount(name, password) {
    const acc = findAccount(name);
    if (!acc) return { ok: false, msg: 'Аккаунт не найден' };

    // Гость — без пароля
    if (acc.isGuest) {
      // можно удалить только если есть другие аккаунты
      const list = getAllAccounts();
      if (list.length <= 1) {
        return { ok: false, msg: 'Нельзя удалить единственный аккаунт' };
      }
      return removeAccountData(name);
    }

    // Обычный аккаунт — проверяем пароль
    if (!password) {
      return { ok: false, msg: 'Введи пароль для удаления' };
    }
    if (acc.password !== password) {
      return { ok: false, msg: 'Неверный пароль' };
    }

    return removeAccountData(name);
  }

  // Внутренняя функция — удаляет аккаунт и его данные
  function removeAccountData(name) {
    let list = getAllAccounts().filter(a => a.name !== name);
    if (list.length === 0) {
      list = [{ name: 'Гость', password: '', isGuest: true }];
    }
    saveAccounts(list);

    // Удаляем все данные аккаунта
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('acc_' + name + '_')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));

    // Если удалили активный — переключаем
    if (localStorage.getItem(KEYS.activeAccount) === name) {
      localStorage.setItem(KEYS.activeAccount, list[0].name);
    }

    return { ok: true };
  }

  function get(key, defaultValue) {
    const v = localStorage.getItem(prefixKey(key));
    return v === null ? (defaultValue !== undefined ? defaultValue : null) : v;
  }
  function set(key, value) {
    localStorage.setItem(prefixKey(key), value);
  }
  function removeKey(key) {
    localStorage.removeItem(prefixKey(key));
  }

  function migrateOldData() {
    const hasOldData = localStorage.getItem('snake_best') ||
                       localStorage.getItem('apples_best') ||
                       localStorage.getItem('tetris_best') ||
                       localStorage.getItem('player_name');
    const hasOldAccData = localStorage.getItem('acc_Гость_snake_best');

    if (hasOldData && !hasOldAccData) {
      const oldKeys = [
        'snake_best', 'snake_best_date',
        'apples_best', 'apples_best_date',
        'tetris_best', 'tetris_best_date',
        'player_name', 'player_avatar',
        'site_total_time', 'site_first_visit', 'site_visits'
      ];
      oldKeys.forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null) {
          localStorage.setItem('acc_Гость_' + key, val);
          localStorage.removeItem(key);
        }
      });
    }
  }

  migrateOldData();
  getActiveAccount();

  window.Accounts = {
    getAll: getAllAccounts,
    getNames: getAccountNames,
    find: findAccount,
    getActive: getActiveAccount,
    setActive: setActiveAccount,
    checkPassword: checkPassword,
    create: createAccount,
    changePassword: changePassword,
    remove: deleteAccount,
    get: get,
    set: set,
    removeKey: removeKey,
    isGuestActive: () => {
      const a = findAccount(getActiveAccount());
      return a ? a.isGuest : true;
    }
  };
})();
async function getSavedWindows() {
    let savedWindows = await chrome.storage.local.get(['savedWindows']);
    if (savedWindows && savedWindows['savedWindows']) {
        return savedWindows['savedWindows'];
    }
    return [];
}

async function refresh() {
    window.location.reload();
}

async function getCurrentWindow() {
    return await chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, { populate: true });
}

async function loadNavTabsStylesHtml() {
    return (await fetch('/nav-tabs/nav-tabs-styles.css')).text();
}

async function loadNavTabsMainHtml() {
    return (await fetch('/nav-tabs/nav-tabs.html')).text();
}

function getSettingsTabLink() {
    return document.getElementById('settings-tab-link');
}
function getMainTabLink() {
    return document.getElementById('main-tab-link');
}

async function getCurrentWindowTabs() {
    let window = await getCurrentWindow();
    console.log('the current window: ', window);
    return { tabs: window.tabs.map(e => { return { url: e.url, id: e.id } }) };
}

function toggleActiveTab(panelName) {
    let settingsTabLink = getSettingsTabLink();
    let mainTabLink = getMainTabLink();
    if (panelName == 'main-side-panel') {
        
        settingsTabLink.classList.remove('active');
        settingsTabLink.removeAttribute('aria-current');
        mainTabLink.classList.add('active');
        mainTabLink.setAttribute('aria-current', 'page');
    }
    else if (panelName == 'settings-panel') {
        mainTabLink.classList.remove('active');
        mainTabLink.removeAttribute('aria-current');
        settingsTabLink.classList.add('active');
        settingsTabLink.setAttribute('aria-current', 'page');
    }
}

async function loadNavTabs(panelName) {
    
    loadNavTabsStylesHtml().then(html => {
        let elem = document.createElement('style');
        elem.innerHTML = html;
        document.body.after(elem);
        
        loadNavTabsMainHtml().then(html => {
            document.getElementById('nav-tabs-container').innerHTML = html;
            let elem = document.createElement('script');
            elem.setAttribute('src', '/nav-tabs/nav-tabs-elements.js');
            let elem2 = document.createElement('script');
            elem2.setAttribute('src', '/nav-tabs/nav-tabs.js');
            document.body.after(elem);
            elem.onload = function () {
                document.body.after(elem2);
                toggleActiveTab(panelName);
            }
        });
    });
}

async function getCurrentSelectedWindow() {
    let selectedWindow = await chrome.storage.local.get(['selectedWindow']);
    console.log('retrieved selectedWindow: ', selectedWindow);
    if (selectedWindow && selectedWindow['selectedWindow']) {
        return selectedWindow['selectedWindow'];
    }
    return undefined;
}

async function wait(waitMilis) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('waited ' + waitMilis + 'ms');
        }, waitMilis);
    });
}

function addToArrayIfNotExists(arr, elem) {
    let newArr = [];
    for (let e of arr) {
        if (e == elem) {
            return arr;
        }
        else {
            newArr.push(e);
        }
    }
    newArr.push(elem);

    return newArr;
}

async function persist(obj) {
    await chrome.storage.local.set(obj);
}

async function checkDarkModeState(panelName) {
    const darkMode = (await chrome.storage.local.get('darkMode'))['darkMode'];
    console.log('darks: ', darkMode);
    if (darkMode === true) {
        document.body.style.backgroundColor = 'black';
        document.body.style.color = 'white';
        if (panelName == 'settings-panel') {
            document.getElementById('dark-mode-text').innerText = 'Light Mode';
            document.getElementById('dark-mode-icon').classList.remove('fa-moon');
            document.getElementById('dark-mode-icon').classList.add('fa-sun');
            document.getElementById('dark-mode-icon').classList.remove('fa-solid');
            document.getElementById('dark-mode-icon').classList.add('fa-regular');
        }
    }
    else {
        document.body.style.backgroundColor = 'white';
        document.body.style.color = 'black';
        if (panelName == 'settings-panel') {
            document.getElementById('dark-mode-text').innerText = 'Dark Mode';
            document.getElementById('dark-mode-icon').classList.remove('fa-sun');
            document.getElementById('dark-mode-icon').classList.add('fa-moon');
            document.getElementById('dark-mode-icon').classList.remove('fa-regular');
            document.getElementById('dark-mode-icon').classList.add('fa-solid');
        }
    }
}

async function removeFromStorage(key) {
    await chrome.storage.local.remove(key);
}

function tabsMatching(tabs1, tabs2) {
    if (tabs1.length != tabs2.length) {
        return false;
    }
    for (let i = 0; i < tabs1.length; i++) {
        let tab1 = tabs1[i];
        let tab2 = tabs2[i];

        if (tab1.url != tab2.url) {
            return false;
        }
    }

    return true;
}

function getMatchingWindowsIndex(window, savedWindows) {
    let tabs = window.tabs;

    for (let i = 0; i < savedWindows.length; i++) {
        let savedWindow = savedWindows[i];
        if (tabsMatching(tabs, savedWindow.tabs)) {
            return i;
        }
    }

    return -1;
}
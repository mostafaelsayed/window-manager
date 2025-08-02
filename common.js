async function getSavedWindows() {
    let savedWindows = await chrome.storage.local.get(['savedWindows']);
    if (savedWindows && savedWindows['savedWindows']) {
        return savedWindows['savedWindows'];
    }
    return [];
}

function refresh() {
    window.location.replace(window.location);
}

async function getCurrentWindow() {
    return await chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, { populate: true });
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
    
    for (let i = 0 ; i < savedWindows.length; i++) {
        let savedWindow = savedWindows[i];
        if (tabsMatching(tabs, savedWindow.tabs)) {
            return i;
        }
    }

    return -1;
}
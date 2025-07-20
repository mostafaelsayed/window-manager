let lastEventTime = 0;

importScripts('common.js');

let openedWindowName = '';

async function handleWindowOpenningRequest(windowNameToOpen) {
    openedWindowName = windowNameToOpen;
    await chrome.windows.create({url: (await getSavedWindows()).find(e => e.name == windowNameToOpen).tabs.map(e => e.url)});
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

async function handleWindowSavingRequest(windowToSave) {
    await persist({selectedWindow: {
        name: windowToSave.name,
        id: windowToSave.id
    }});
    console.log('saved selected window!!');
    let savedWindows = await getSavedWindows();
    let savedWindowIndex = savedWindows.findIndex(e => e.name == windowToSave.name);
    if (savedWindowIndex !== -1) {
        let savedWindow = savedWindows[savedWindowIndex];
        savedWindow.ids = addToArrayIfNotExists(savedWindow.ids, windowToSave.id);
        savedWindow.tabs = windowToSave.tabs;
        savedWindows[savedWindowIndex] = savedWindow;
    }
    else {
        savedWindows.push({
            ids: [windowToSave.id],
            name: windowToSave.name,
            tabs: windowToSave.tabs
        });
    }
    await persist({savedWindows});
    console.log('saved windows!!');
}

async function handleWindowDeletionRequest(windowNameToDelete) {
    let savedWindows = await getSavedWindows();
    savedWindows.splice(savedWindows.findIndex(e => e.name == windowNameToDelete), 1);
    await persist({savedWindows});
}

async function handleRequest(request) {
    if (request.windowToSave) {
        await handleWindowSavingRequest(request.windowToSave);
    }
    else if (request.windowNameToOpen) {
        await handleWindowOpenningRequest(request.windowNameToOpen);
    }
    else if (request.windowNameToDelete) {
        await handleWindowDeletionRequest(request.windowNameToDelete);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let eventTime = Date.now();
    console.log('request sent: ', request);
    console.log('eventTime: ', eventTime);
    if (eventTime > lastEventTime) {
        handleRequest(request).then(() => sendResponse('done'));
        return true;
    }
});

async function tabRemovedListener(tabId, removeInfo) {
    let savedWindows = await getSavedWindows();
    console.log('tabRemovedListener savedWindows: ', savedWindows);
    let savedWindowIndex = savedWindows.findIndex(e => e.ids.includes(removeInfo.windowId));
    if (savedWindowIndex === -1) {
        console.log('window not saved so do nothing!!');
        return;
    }
    let savedWindow = savedWindows[savedWindowIndex];
    savedWindow.tabs.splice(savedWindow.tabs.findIndex(e => e.id == tabId), 1);
    savedWindows[savedWindowIndex] = savedWindow;
    await persist({savedWindows});
}

chrome.tabs.onRemoved.addListener(tabRemovedListener);

async function windowFocusChangeListener() {
    let eventTime = Date.now();
    const window = await chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, { populate: true });
    const windowId = window.id;
    let savedWindows = await getSavedWindows();
    console.log('windowFocusChangeListener savedWindows: ', savedWindows);
    if (savedWindows.length == 0) {
        await removeFromStorage('selectedWindow');
        return;
    }
    
    const savedWindowIndex = savedWindows.findIndex(e => e.ids.includes(windowId));

    if (savedWindowIndex !== -1) {
        let savedWindow = savedWindows[savedWindowIndex];
        if (eventTime > lastEventTime) {
            lastEventTime = eventTime;
            await persist({selectedWindow: {
                name: savedWindow.name,
                id: windowId
            }});
            console.log('windowFocusChangeListener found saved window');
            savedWindow.tabs = window.tabs.map((e) => {return {id: e.id, url: e.url}});
            savedWindows[savedWindowIndex] = savedWindow;
            await persist({savedWindows});
        }
    }
    else {
        await removeFromStorage('selectedWindow');
        console.log('windowFocusChangeListener No saved window found');
    }
}

chrome.windows.onFocusChanged.addListener(windowFocusChangeListener);

async function removeFromStorage(key) {
    await chrome.storage.local.remove(key);
}

async function persist(obj) {
    await chrome.storage.local.set(obj);
}

async function tabUpdatedListener(tabId, changeInfo, tab) {
    let window = await chrome.windows.get(tab.windowId, { populate: true });
    let savedWindows = await getSavedWindows();
    console.log('tabUpdatedListener savedWindows: ', savedWindows);
    let savedWindowIndex = savedWindows.findIndex(e => e.ids.includes(window.id));
    let savedWindow = savedWindows[savedWindowIndex];
    if (savedWindow) {
        let savedWindowTabs = savedWindow.tabs;
        for (let i = 0 ; i < savedWindowTabs.length; i++) {
            let currentTab = savedWindowTabs[i];
            if (tabId == currentTab.id) {
                if (changeInfo.url) {
                    savedWindowTabs[i].url = changeInfo.url;
                    savedWindows[savedWindowIndex].tabs = savedWindowTabs;
                    await persist({savedWindows});
                }
                break;
            }
        };
    }
}

chrome.tabs.onUpdated.addListener(tabUpdatedListener);

async function windowCreatedListener(window) {
    chrome.tabs.onCreated.removeListener(tabCreatedListener);
    let savedWindows = await getSavedWindows();
    console.log('windowCreatedListener savedWindows: ', savedWindows);
    const savedWindowIndex = savedWindows.findIndex(e => e.name == openedWindowName);
    if (savedWindowIndex !== -1) {
        let savedWindow = savedWindows[savedWindowIndex];
        await persist({selectedWindow: {
            name: savedWindow.name,
            id: window.id
        }});
        savedWindow.ids = addToArrayIfNotExists(savedWindows[savedWindowIndex].ids, window.id);
        savedWindows[savedWindowIndex] = savedWindow;
        await persist({savedWindows});
    }
    else {
        await removeFromStorage('selectedWindow');
    }
    
   
    chrome.tabs.onCreated.addListener(tabCreatedListener);
}

chrome.windows.onCreated.addListener(windowCreatedListener);

async function windowRemovedListener(windowId) {
    chrome.tabs.onRemoved.removeListener(tabRemovedListener);
    let savedWindows = await getSavedWindows();
    console.log('windowRemovedListener savedWindows: ', savedWindows);
    const savedWindowIndex = savedWindows.findIndex(e => e.ids.includes(windowId));
    if (savedWindowIndex !== -1) {
        let savedWindow = savedWindows[savedWindowIndex];
        let ids = savedWindow.ids;
        ids.splice(ids.findIndex(e => e == windowId), 1);
        savedWindow.ids = ids;
        savedWindows[savedWindowIndex] = savedWindow;
        await persist({savedWindows});
        savedWindows = await getSavedWindows();
        console.log('windowRemovedListener savedWindows end: ', savedWindows);
    }
    chrome.tabs.onRemoved.addListener(tabRemovedListener);
}

chrome.windows.onRemoved.addListener(windowRemovedListener);

async function tabCreatedListener(tab) {
    let window = await chrome.windows.get(tab.windowId, { populate: true });
    let savedWindows = await getSavedWindows();
    console.log('tabCreatedListener savedWindows: ', savedWindows);
    let savedWindowIndex = savedWindows.findIndex(e => e.ids.includes(window.id));
    let savedWindow = savedWindows[savedWindowIndex];
    if (!savedWindow) {
        return;
    }
    let currentWindowTabs = savedWindow.tabs;
    let tabExists = currentWindowTabs.findIndex(e => e.id == tab.id) !== -1;
    if (tabExists) {
        return;
    }
    currentWindowTabs.push({id: tab.id, url: tab.url});
    savedWindows[savedWindowIndex].tabs = currentWindowTabs;
    await persist({savedWindows});
}

chrome.tabs.onCreated.addListener(tabCreatedListener);
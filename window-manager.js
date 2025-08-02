importScripts('common.js');

let openedWindowName = '';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

function onMessageListener(request, sender, sendResponse) {
    console.log('request sent: ', request);
    handleRequest(request).then((res) => sendResponse({message: res, status: 'success'})).catch((e) => sendResponse({message: e.message, status: 'failed'}));
    return true;
}

chrome.runtime.onMessage.addListener(onMessageListener);

async function handleWindowOpenningRequest(windowNameToOpen) {
    openedWindowName = windowNameToOpen;
    await chrome.windows.create({url: (await getSavedWindows()).find(e => e.name == windowNameToOpen).tabs.map(e => e.url)});
}

async function logSavedWindowsMetadata(functionName, savedWindows) {
    console.log(`${functionName} savedWindows of length ${savedWindows.length}:`);
    for (let window of savedWindows) {
        console.log(`logging info for window '${window.name}'`);
        console.log('window tabs length: ', window.tabs.length);
    }
}

async function handleWindowSavingRequest(windowToSave) {
    if (windowToSave.name.trim() == '') {
        console.log('empty name');
        throw new Error(`please enter a name`);
    }
    console.log('saved selected window!!');
    let savedWindows = await getSavedWindows();
    console.log('handleWindowSavingRequest savedWindows: ', savedWindows);
    let window = windowToSave.current === false ? windowToSave : (await getCurrentWindow());
    const matchingIndex = getMatchingWindowsIndex(window, savedWindows);
    console.log('matching index: ', matchingIndex);
    if (matchingIndex !== -1) {
        throw new Error(`already found window with same tabs with name '${savedWindows[matchingIndex].name}'`);
    }
    const savedWindowIndex = savedWindows.findIndex(e => e.name == windowToSave.name);
    console.log('savedWindowIndex: ', matchingIndex);
    if (savedWindowIndex !== -1) {
        let savedWindow = savedWindows[savedWindowIndex];
        savedWindow.tabs = windowToSave.tabs;
        savedWindows[savedWindowIndex] = savedWindow;
    }
    else {
        savedWindows.push({
            name: windowToSave.name,
            tabs: windowToSave.tabs
        });
    }
    await persist({selectedWindow: {
        name: windowToSave.name
    }});
    await persist({savedWindows});

    console.log('saved windows!!');
    
    return `window saved`;
}

async function handleWindowDeletionRequest(windowNameToDelete) {
    let savedWindows = await getSavedWindows();
    savedWindows.splice(savedWindows.findIndex(e => e.name == windowNameToDelete), 1);
    await persist({savedWindows});
}

async function handleRequest(request) {
    try {
        if (request.windowToSave) {
            return await handleWindowSavingRequest(request.windowToSave);
        }
        else if (request.windowNameToOpen) {
            return await handleWindowOpenningRequest(request.windowNameToOpen);
        }
        else if (request.windowNameToDelete) {
            return await handleWindowDeletionRequest(request.windowNameToDelete);
        }
    }
    catch(e) {
        console.log('save error: ', e);
        throw new Error(e);
    }
}

function findMatchingTabWindow(tabId, savedWindows) {
    for (let i = 0; i < savedWindows.length; i++) {
        for (let j = 0; j < savedWindows[i].tabs.length; j++) {
            if (savedWindows[i].tabs[j].id == tabId) {
                return i;
            }
        }
    }

    return -1;
}

async function windowFocusChangeListener() {
    const window = await getCurrentWindow();
    let savedWindows = await getSavedWindows();
    if (savedWindows.length == 0) {
        await removeFromStorage('selectedWindow');
        try {
            await chrome.runtime.sendMessage({refreshSelectedWindowName: true});
        }
        catch(e) {
            console.warn('error sending: ', e.message);
        }
        return;
    }
    
    const matchingIndex = getMatchingWindowsIndex(window, savedWindows);
    
    if (matchingIndex !== -1) {
        let savedWindow = savedWindows[matchingIndex];
        await persist({selectedWindow: {
            name: savedWindow.name
        }});
        try {
            await chrome.runtime.sendMessage({refreshSelectedWindowName: true});
        }
        catch(e) {
            console.warn('error sending: ', e.message);
        }
    }
    else {
        await removeFromStorage('selectedWindow');
        console.log('windowFocusChangeListener No saved window found');
    }
}

chrome.windows.onFocusChanged.addListener(windowFocusChangeListener);
let previousSelected = undefined;
let currentSelected = [];

async function tabHighlightedListener(info) {
    console.log('info: ', info);
    
    try {
        await chrome.contextMenus.remove(
            'window-manager-save'
        );
    }
    catch(e) {
        console.warn('no id found');
    }
    await chrome.contextMenus.create(
        {id: 'window-manager-save', title: 'Save Selected Tabs in New window', contexts: ['page']}
        , () => chrome.runtime.lastError
    )
    let selectedTabs = (await chrome.tabs.query({highlighted: true, currentWindow: true})).map((e) => {
        return {
            id: e.id,
            url: e.pendingUrl || e.url
        }});
    if (!previousSelected) {
        previousSelected = selectedTabs;
        await persist({
            selectedTabs: previousSelected
        });
    }
    else {
        await persist({
            selectedTabs: previousSelected
        });
        previousSelected = selectedTabs;
    }
}

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'save-selected-tabs-panel') {
    port.onDisconnect.addListener(async () => {
    console.log('closed');
      await chrome.sidePanel.setOptions({
            path: 'side-panel.html'
        });
    });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {    
    try {
        chrome.sidePanel.open({ windowId: tab.windowId });
        await chrome.sidePanel.setOptions({
            path: 'side-panel-selected-tabs.html'
        });
        await chrome.storage.local.set({selectedTabsSavingRequest: true});
    }
    catch(e) {
        console.error('side-panel-selected-tabs opening fail: ', e);
    }
});

chrome.tabs.onHighlighted.addListener(tabHighlightedListener)
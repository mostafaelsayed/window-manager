importScripts('common.js');

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

function onMessageListener(request, sender, sendResponse) {
    console.log('request sent: ', request);
    handleRequest(request).then((res) => sendResponse({message: res, status: 'success'})).catch((e) => sendResponse({message: e.message, status: 'failed'}));
    return true;
}

chrome.runtime.onMessage.addListener(onMessageListener);

(async() => {
    await chrome.contextMenus.create(
        {id: 'Enable Dark Mode for this tab', title: 'Enable Dark Mode for this tab', contexts: ['page']}
        , () => chrome.runtime.lastError
    )
})();

async function handleWindowOpenningRequest(windowNameToOpen) {
    await chrome.windows.create({url: (await getSavedWindows()).find(e => e.name == windowNameToOpen).tabs.map(e => e.url), state: 'maximized'});
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

let previousSelected = undefined;
let currentSelected = [];

async function createAddSelectedTabToSavedWindowContextMenuItem() {
    await chrome.contextMenus.create(
        {id: 'add-selected-tab-to-window', title: 'Add Selected Tabs to a window', contexts: ['page']}
        , () => chrome.runtime.lastError
    )
    let savedWindows = await getSavedWindows();
    for (let window of savedWindows) {
        await chrome.contextMenus.create(
            {id: 'add-selected-tab-to-window-' + window.name, parentId: 'add-selected-tab-to-window', title: window.name, contexts: ['page']}
            , () => chrome.runtime.lastError
        )
    }
}

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
    try {
        await chrome.contextMenus.remove(
            'add-selected-tab-to-window'
        );
    }
    catch(e) {
        console.warn('no id found');
    }
    await chrome.contextMenus.create(
        {id: 'window-manager-save', title: 'Save Selected Tabs in New window', contexts: ['page']}
        , () => chrome.runtime.lastError
    );
    await createAddSelectedTabToSavedWindowContextMenuItem();
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
    console.log(`closed panel ${port.name}`);
      await chrome.sidePanel.setOptions({
            path: 'main-side-panel/main-side-panel.html'
        });
    });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {    
    try {
        if (info.menuItemId == 'window-manager-save') {
            chrome.sidePanel.open({ windowId: tab.windowId });
            await chrome.action.openPopup({});
        }
        else if (info.menuItemId.startsWith('add-selected-tab-to-window-')) {
            let savedWindows = await getSavedWindows();
            let savedWindowIndex = savedWindows.findIndex(e => {
                return e.name == info.menuItemId.substring('add-selected-tab-to-window-'.length)
            });
            let previouslySelectedTabs = (await chrome.storage.local.get('selectedTabs'))['selectedTabs'];
            let savedWindow = savedWindows[savedWindowIndex];
            savedWindow.tabs.push(...previouslySelectedTabs);
            savedWindows[savedWindowIndex] = savedWindow;
            await persist({
                savedWindows
            });
        }
        else if (info.menuItemId == 'Enable Dark Mode for this tab') {
            (async () => {
                const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
                await chrome.tabs.sendMessage(tab.id, {data: "enable-dark-mode-for-this-tab"});
                let tabsGlobalSettings = await get('tabsGlobalSettings');
                if (!tabsGlobalSettings) {
                    tabsGlobalSettings = {};
                }
                tabsGlobalSettings[tab.url] = {
                    darkMode: true
                };
                
                await persist({
                    tabsGlobalSettings
                });
            })();
        }
    }
    catch(e) {
        console.error('side-panel-selected-tabs opening fail: ', e);
    }
});

chrome.tabs.onHighlighted.addListener(tabHighlightedListener)
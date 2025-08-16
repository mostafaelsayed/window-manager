importScripts('common.js');

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

function onMessageListener(request, sender, sendResponse) {
    console.log('request sent: ', request);
    handleRequest(request).then((res) => sendResponse({message: res, status: 'success'})).catch((e) => sendResponse({message: e.message, status: 'failed'}));
    return true;
}

chrome.runtime.onMessage.addListener(onMessageListener);

initContextMenu();

async function initContextMenu() {
    await chrome.contextMenus.remove(
        'add-selected-tab-to-window', () => chrome.runtime.lastError
    );
    await chrome.contextMenus.remove(
        'window-manager-save', () => chrome.runtime.lastError
    );
    let tabsGlobalSettings = (await get('tabsGlobalSettings')) || {};
    let domainGlobalSettings = (await get('domainGlobalSettings')) || {};
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const hostNameWithProtocol = getHostNameWithProtocolFromCurrentUrl(tab);
    console.log('tabsGlobalSettings: ', tabsGlobalSettings);
    console.log('the tab url: ', tab.url);
    if (!tabsGlobalSettings[tab.url] && !domainGlobalSettings[hostNameWithProtocol]) {
        await chrome.contextMenus.remove('Disable Dark Mode for this site', () => chrome.runtime.lastError);
        await chrome.contextMenus.remove('Disable Dark Mode for the current site domain', () => chrome.runtime.lastError);
        await chrome.contextMenus.create(
            {id: 'Enable Dark Mode for this site', title: 'Enable Dark Mode for this site', contexts: ['page']}
            , () => chrome.runtime.lastError
        );
        await chrome.contextMenus.create(
            {id: 'Enable Dark Mode for the current site domain', title: 'Enable Dark Mode for the current site domain', contexts: ['page']}
            , () => chrome.runtime.lastError
        );
    }
    else if (!tabsGlobalSettings[tab.url]?.darkMode && !domainGlobalSettings[hostNameWithProtocol]?.darkMode) {
        console.log('reset context!');
        await chrome.contextMenus.remove('Disable Dark Mode for this site', () => chrome.runtime.lastError);
        await chrome.contextMenus.remove('Disable Dark Mode for the current site domain', () => chrome.runtime.lastError);
        await chrome.contextMenus.create(
            {id: 'Enable Dark Mode for this site', title: 'Enable Dark Mode for this site', contexts: ['page']}
            , () => chrome.runtime.lastError
        );
        await chrome.contextMenus.create(
            {id: 'Enable Dark Mode for the current site domain', title: 'Enable Dark Mode for the current site domain', contexts: ['page']}
            , () => chrome.runtime.lastError
        );
    }
    else if (domainGlobalSettings[hostNameWithProtocol] && domainGlobalSettings[hostNameWithProtocol].darkMode === true) {
        await chrome.contextMenus.remove('Disable Dark Mode for this site', () => chrome.runtime.lastError);
        await chrome.contextMenus.remove('Enable Dark Mode for this site', () => chrome.runtime.lastError);
        await chrome.contextMenus.remove('Enable Dark Mode for the current site domain', () => chrome.runtime.lastError);
        await chrome.contextMenus.create(
            {id: 'Disable Dark Mode for the current site domain', title: 'Disable Dark Mode for the current site domain', contexts: ['page']}
            , () => chrome.runtime.lastError
        );
    }
    else if (tabsGlobalSettings[tab.url] && tabsGlobalSettings[tab.url].darkMode === true) {
        await chrome.contextMenus.remove('Enable Dark Mode for this site', () => chrome.runtime.lastError);
        await chrome.contextMenus.remove('Disable Dark Mode for the current site domain', () => chrome.runtime.lastError);
        await chrome.contextMenus.create(
            {id: 'Disable Dark Mode for this site', title: 'Disable Dark Mode for this site', contexts: ['page']}
            , () => chrome.runtime.lastError
        );
        await chrome.contextMenus.create(
            {id: 'Enable Dark Mode for the current site domain', title: 'Enable Dark Mode for the current site domain', contexts: ['page']}
            , () => chrome.runtime.lastError
        );
    }

    await chrome.contextMenus.create(
        {id: 'window-manager-save', title: 'Save Selected Tabs in New window', contexts: ['page']}
        , () => chrome.runtime.lastError
    );

    await createAddSelectedTabToSavedWindowContextMenuItem();
}

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
    await initContextMenu();
    let selectedTabs = (await chrome.tabs.query({highlighted: true, currentWindow: true})).map((e) => {
        chrome.tabs.sendMessage(e.id, {data: "check-dark-mode-state"});
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

async function addSelectedTabToWindowContextMenu(info) {
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

async function saveCurrentWindow() {
    chrome.sidePanel.open({ windowId: tab.windowId });
    await chrome.action.openPopup({});
}

chrome.contextMenus.onClicked.addListener(async (info) => {    
    try {
        if (info.menuItemId == 'window-manager-save') {
            saveCurrentWindow();
        }
        else if (info.menuItemId.startsWith('add-selected-tab-to-window-')) {
            addSelectedTabToWindowContextMenu(info);
        }
        else if (info.menuItemId == 'Enable Dark Mode for this site') {
            handleSiteDarkMode();
        }
        else if (info.menuItemId == 'Enable Dark Mode for the current site domain') {
            handleDomainDarkMode();
        }
        else if (info.menuItemId == 'Disable Dark Mode for this site') {
            handleSiteDarkModeDisable();
        }
        else if (info.menuItemId == 'Disable Dark Mode for the current site domain') {
            handleDomainDarkModeDisable();
        }
    }
    catch(e) {
        console.error('side-panel-selected-tabs opening fail: ', e);
    }
});

async function handleSiteDarkMode() {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    
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

    await chrome.tabs.sendMessage(tab.id, {data: "enable-dark-mode-for-this-site"});

    await initContextMenu();
}

async function handleSiteDarkModeDisable() {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    
    let tabsGlobalSettings = await get('tabsGlobalSettings');
    
    tabsGlobalSettings[tab.url].darkMode = undefined;
    
    await persist({
        tabsGlobalSettings
    });

    await chrome.tabs.sendMessage(tab.id, {data: "disable-dark-mode-for-this-site"});
    
    await initContextMenu();
}

async function handleDomainDarkMode() {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    
    let domainGlobalSettings = await get('domainGlobalSettings');
    if (!domainGlobalSettings) {
        domainGlobalSettings = {};
    }
    const hostNameWithProtocol = getHostNameWithProtocolFromCurrentUrl(tab);
    domainGlobalSettings[hostNameWithProtocol] = {
        darkMode: true
    };
    
    await persist({
        domainGlobalSettings
    });

    await chrome.tabs.sendMessage(tab.id, {data: "enable-dark-mode-for-the-current-site-domain"});

    await initContextMenu();
}

async function handleDomainDarkModeDisable() {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    
    let domainGlobalSettings = await get('domainGlobalSettings');

    const hostNameWithProtocol = getHostNameWithProtocolFromCurrentUrl(tab);
    domainGlobalSettings[hostNameWithProtocol].darkMode = undefined;
    
    await persist({
        domainGlobalSettings
    });

    await chrome.tabs.sendMessage(tab.id, {data: "disable-dark-mode-for-the-current-site-domain"});

    await initContextMenu();
}

function getHostNameWithProtocolFromCurrentUrl(tab) {
    let hostname = new URL(tab.url).hostname;
    let hostNameWithProtocol = tab.url.substring(0, tab.url.indexOf(':')) + '://' + hostname;

    return hostNameWithProtocol;
}

chrome.tabs.onHighlighted.addListener(tabHighlightedListener);
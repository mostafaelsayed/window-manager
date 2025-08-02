async function init() {
    await loadNavTabs('main-side-panel');
    loadSavedWindowsDropdown();
    await checkCurrentWindowName();
    await updateSelectedWindowNamePlaceholder();
}

async function checkCurrentWindowName() {
    const window = await getCurrentWindow();
    let savedWindows = await getSavedWindows();
    if (savedWindows.length == 0) {
        await removeFromStorage('selectedWindow');
    }
    
    const matchingIndex = getMatchingWindowsIndex(window, savedWindows);
    
    if (matchingIndex !== -1) {
        let savedWindow = savedWindows[matchingIndex];
        await persist({selectedWindow: {
            name: savedWindow.name
        }});
    }
    else {
        await removeFromStorage('selectedWindow');
    }
}

function showSavedWindowsContainer() {
    getSavedWindowsContainer().style.visibility = 'visible';
}

function hideSavedWindowsContainer() {
    getSavedWindowsContainer().style.visibility = 'hidden';
}

async function loadSavedWindowsDropdown() {
    let savedWindows = await getSavedWindows();
    console.log('saved windows on load: ', savedWindows);
    if (savedWindows && savedWindows.length > 0) {
        for (let elem of savedWindows) {
            addOptionToCustomDropdown(getSavedWindowsDropdown(), elem.name);
        }
        showSavedWindowsContainer();
    }
}

init();
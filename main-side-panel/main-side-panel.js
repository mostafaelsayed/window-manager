async function init() {
    await loadNavTabs('main-side-panel');
    loadSavedWindowsDropdown();
    await updateSelectedWindowNamePlaceholder();
}

function showSavedWindowsContainer() {
    getSavedWindowsContainer().style.visibility = 'visible';
}

function hideSavedWindowsContainer() {
    getSavedWindowsContainer().style.visibility = 'hidden';
}

async function updateSelectedWindowNamePlaceholder() {
    const currentSelectedWindow = await getCurrentSelectedWindow();
    if (currentSelectedWindow && currentSelectedWindow.name) {
        getSelectedWindowNamePlaceholder().innerText = "You are now in the window named '" + currentSelectedWindow.name + "'";
    }
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
async function init() {
    let saveButton = document.getElementById('save-button');

    saveButton.addEventListener('click', saveWindow);

    let openSavedWindowButton = document.getElementById('open-selected-saved-window');

    openSavedWindowButton.addEventListener('click', openSavedWindow);

    let removeButton = document.getElementById('remove-selected-saved-window');

    removeButton.addEventListener('click', removeWindow);

    loadDropdown();

    await updateSelectedWindowNamePlaceholder();
}

function showOpenWindowContainer() {
    getOpenWindowContainer().style.visibility = 'visible';
}

function hideOpenWindowContainer() {
    getOpenWindowContainer().style.visibility = 'hidden';
}

let getOpenWindowContainer = function() {
    return document.getElementById("open-window-container");
}

async function getCurrentWindowTabs() {
    let window = await chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, { populate: true });
    console.log('the current window: ', window);
    return {tabs: window.tabs.map(e => {return {url: e.url, id: e.id}}), windowId: window.id};
}

async function openSavedWindow() {
    const dropdown = getSavedWindowsDropdown();
    const savedWindowName = dropdown.options[dropdown.selectedIndex].value;
    await chrome.runtime.sendMessage({windowNameToOpen: savedWindowName});
}

async function getCurrentSelectedWindow() {
    let selectedWindow = await chrome.storage.local.get(['selectedWindow']);
    console.log('retrieved selectedWindow: ', selectedWindow);
    if (selectedWindow && selectedWindow['selectedWindow']) {
        return selectedWindow['selectedWindow'];
    }
    return undefined;
}

async function saveWindow() {
    const windowName = document.getElementById('currentWindowName').value;
    let savedWindows = await getSavedWindows();
    console.log('window name to save: ', windowName);
    const windowTabs = await getCurrentWindowTabs();
    let windowExists = savedWindows.findIndex(e => e.name == windowName) !== -1;
    if (windowExists) {
        if (!confirm('Window with name ' + windowName + ' already exists. Overwrite it?')) {
            return;
        }
    }
    if (!windowExists) {
        addOptionToDropdown(windowName);
    }
    await chrome.runtime.sendMessage({ windowToSave: {
        name: windowName,
        id: windowTabs.windowId,
        tabs: windowTabs.tabs
    }});
    
    savedWindows = await getSavedWindows();
    console.log('final saved windows: ', savedWindows);

    if (savedWindows.length >= 1) {
        showOpenWindowContainer();
    }
    await updateSelectedWindowNamePlaceholder();
}

async function updateSelectedWindowNamePlaceholder() {
    const currentSelectedWindow = await getCurrentSelectedWindow();
    if (currentSelectedWindow && currentSelectedWindow.name) {
        document.getElementById('selected-window-name-placeholder').innerText = "You are now in the window named '" + currentSelectedWindow.name + "'";
    }
}

function getSavedWindowsDropdown() {
    return document.getElementById("saved-windows-dropdown");
}

async function removeWindow() {
    let dropdown = getSavedWindowsDropdown();
    const selectedWindowName = dropdown.options[dropdown.selectedIndex].value;

    if (confirm('Are you sure you want to remove this saved window?') == true) {
        await chrome.runtime.sendMessage({windowNameToDelete: selectedWindowName});
        for (let option of dropdown.options) {
            if (option.value == selectedWindowName) {
                document.getElementById('dropdown-option-' + selectedWindowName).remove();
                break;
            }
        }
        let savedWindows = await getSavedWindows();
        if (savedWindows.length == 0) {
            hideOpenWindowContainer();
        }
    }
}

function addOptionToDropdown(windowName) {
    let dropdown = getSavedWindowsDropdown();
    let opt = document.createElement('option');
    opt.value = windowName;
    opt.id = 'dropdown-option-' + windowName;
    opt.innerHTML = windowName;
    dropdown.appendChild(opt);
}


async function loadDropdown() {
    let savedWindows = await getSavedWindows();
    console.log('saved windows on load: ' , savedWindows);
    if (savedWindows && savedWindows.length > 0) {
        for (let elem of savedWindows) {
            addOptionToDropdown(elem.name);
        }
        showOpenWindowContainer();
    }
}

init();
let selectedWindowName = null;

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
    let window = await getCurrentWindow();
    console.log('the current window: ', window);
    return {tabs: window.tabs.map(e => {return {url: e.url, id: e.id}})};
}

async function openSavedWindow() {
    await chrome.runtime.sendMessage({windowNameToOpen: selectedWindowName});
    selectedWindowName = null;
}

async function saveWindow() {
    const windowName = document.getElementById('currentWindowName').value;
    let savedWindows = await getSavedWindows();
    console.log('window name to save: ', windowName);
    const windowTabs = await getCurrentWindowTabs();
    let windowExists = savedWindows.findIndex(e => e.name == windowName) !== -1;
    if (windowExists) {
        if (!confirm(`Window with name '${windowName}' already exists. Overwrite it?`)) {
            return;
        }
    }
    
    let res = await chrome.runtime.sendMessage({ windowToSave: {
        name: windowName,
        tabs: windowTabs.tabs
    }});

    console.log('save res: ', res);

    if (res.status == 'failed') {
        return alert(res.message);
    }

    if (!windowExists) {
        addOptionToCustomDropdown(getSavedWindowsDropdown(), windowName);
    }
    
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
    if (confirm(`Are you sure you want to remove saved window with name '${selectedWindowName}'?`) == true) {
        await chrome.runtime.sendMessage({windowNameToDelete: selectedWindowName});
        document.getElementById('dropdown-option-' + selectedWindowName).remove();
        selectedWindowName = null;
        let savedWindows = await getSavedWindows();
        if (savedWindows.length == 0) {
            hideOpenWindowContainer();
        }
    }
}

function addOptionToCustomDropdown(dropdown, windowName) {
    let opt = document.createElement('li');
    opt.addEventListener('click', dropdownSelected);
    opt.innerHTML = windowName;
    opt.id = 'dropdown-option-' + windowName;
    opt.classList.add('dropdown-item');
    opt.style.cursor = 'pointer';
    dropdown.appendChild(opt);
}

document.getElementById('dropdown-button').addEventListener('mouseover', (e) => {
    document.getElementById('saved-windows-dropdown').style.display = 'block';
});

document.getElementById('dropdown').addEventListener('mouseleave', (e) => {
    document.getElementById('saved-windows-dropdown').style.display = 'none';
});

function dropdownSelected(e) {
    console.log('dropdownSelected: ', e);
    selectedWindowName = e.target.innerText;
    document.getElementById('dropdown-button').innerHTML = selectedWindowName;
    document.getElementById('saved-windows-dropdown').style.display = 'none';
}


async function loadDropdown() {
    let savedWindows = await getSavedWindows();
    console.log('saved windows on load: ' , savedWindows);
    if (savedWindows && savedWindows.length > 0) {
        for (let elem of savedWindows) {
            addOptionToCustomDropdown(getSavedWindowsDropdown(), elem.name);
        }
        showOpenWindowContainer();
    }
}

init();
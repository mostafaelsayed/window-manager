
async function getCurrentWindowUrls() {
    let window = await chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, { populate: true });
    console.log('the current window: ', window);
    return window.tabs.map(e => e.url);
}

async function openSavedWindow() {
    const dropdown = document.getElementById("saved-windows-dropdown");
    const savedWindowName = dropdown.options[dropdown.selectedIndex].value;
    await chrome.windows.create({url: (await chrome.storage.local.get('savedWindows'))['savedWindows'][savedWindowName]});
}

async function refresh() {
    location.replace(location);
}

async function saveWindow() {
    const windowName = document.getElementById('currentWindowName').value;
    let savedWindows = (await chrome.storage.local.get('savedWindows'))['savedWindows'] || {};
    console.log('window name to save: ', windowName);
    const urls = await getCurrentWindowUrls();
    savedWindows[windowName] = urls;
    await chrome.storage.local.set({savedWindows});
    console.log('final saved windows: ', savedWindows);
    const returned = (await chrome.storage.local.get('savedWindows'))['savedWindows'];
    console.log('saved from api: ',  returned);
    let dropdown = document.getElementById("saved-windows-dropdown");
    addOptionToDropdown(dropdown, windowName);
    if (Object.keys(savedWindows).length == 1) {
        document.getElementById("open-window-container").style.visibility = 'visible';
    }
}

async function removeWindow() {
    let dropdown = document.getElementById("saved-windows-dropdown");
    const selectedWindowName = dropdown.options[dropdown.selectedIndex].value;

    if (confirm('Are you sure you want to remove this saved window?') == true) {
        let savedWindows = (await chrome.storage.local.get('savedWindows'))['savedWindows'];
        delete savedWindows[selectedWindowName];
        await chrome.storage.local.set({savedWindows});
        for (let option of dropdown.options) {
            if (option.value == selectedWindowName) {
                document.getElementById('dropdown-option-' + selectedWindowName).remove()
            }
        }

        if (Object.keys(savedWindows).length == 0) {
            document.getElementById("open-window-container").style.visibility = 'hidden';
        }
    }
}

function addOptionToDropdown(dropdown, windowName) {
    let opt = document.createElement('option');
    opt.value = windowName;
    opt.id = 'dropdown-option-' + windowName;
    opt.innerHTML = windowName;
    dropdown.appendChild(opt);
}


async function loadDropdown() {
    let savedWindows = await chrome.storage.local.get('savedWindows');
    console.log('saved windows on load: ' , savedWindows);
    if (savedWindows['savedWindows'] && Object.keys(savedWindows['savedWindows']).length > 0) {
        let dropdown = document.getElementById("saved-windows-dropdown");
        for (let key in savedWindows['savedWindows']) {
            addOptionToDropdown(dropdown, key);
        }
        document.getElementById("open-window-container").style.visibility = 'visible';
    }
}

let saveButton = document.getElementById('save-button');

let openSavedWindowButton = document.getElementById('open-selected-saved-window');

saveButton.addEventListener('click', saveWindow);

openSavedWindowButton.addEventListener('click', openSavedWindow);

let refreshButton = document.getElementById('refresh');

refreshButton.addEventListener('click', refresh);

let removeButton = document.getElementById('remove-selected-saved-window');

removeButton.addEventListener('click', removeWindow);

loadDropdown();
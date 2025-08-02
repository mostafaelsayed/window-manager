
let selectedWindowName = null;
let saveButton = getSaveButton();
let openSavedWindowButton = getOpenSelectedSavedWindow();
let removeButton = getRemoveSavedWindowButton();
let savedWindowsDropdownButton = getSavedWindowsDropdownButton();

async function saveWindowListener() {
    const windowName = getCurrentWindowNameToSaveInput().value;
    let savedWindows = await getSavedWindows();
    console.log('window name to save: ', windowName);
    const windowTabs = await getCurrentWindowTabs();
    let windowExists = savedWindows.findIndex(e => e.name == windowName) !== -1;
    if (windowExists) {
        if (!confirm(`Window with name '${windowName}' already exists. Overwrite it?`)) {
            return;
        }
    }

    let res = await chrome.runtime.sendMessage({
        windowToSave: {
            name: windowName,
            tabs: windowTabs.tabs
        }
    });

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
        showSavedWindowsContainer();
    }
    await updateSelectedWindowNamePlaceholder();
    alert('Window Saved Successfully!');
}

async function openSavedWindowListener() {
    await chrome.runtime.sendMessage({ windowNameToOpen: selectedWindowName });
}

async function removeWindowListener() {
    if (!selectedWindowName || selectedWindowName.trim() == '') {
        return alert('Please select a Window first');
    }
    if (confirm(`Are you sure you want to remove saved window with name '${selectedWindowName}'?`) == true) {
        await chrome.runtime.sendMessage({ windowNameToDelete: selectedWindowName });
        document.getElementById('dropdown-option-' + selectedWindowName).remove();
        let savedWindows = await getSavedWindows();
        if (savedWindows.length == 0) {
            hideSavedWindowsContainer();
        }
        alert(`Window '${selectedWindowName}' removed successfully!`);
    }
}

async function savedWindowsDropdownButtonListener() {
    let dropdown = getSavedWindowsDropdown();
    let display = dropdown.style.display;
    dropdown.style.display = (display == 'block' ? 'none' : 'block');
    let dropdownCaret = getSavedWindowsDropdownCaret();
    if (dropdownCaret.classList.contains('fa-caret-down')) {
        dropdownCaret.classList.remove('fa-caret-down');
        dropdownCaret.classList.add('fa-caret-up');
    }
    else {
        dropdownCaret.classList.remove('fa-caret-up');
        dropdownCaret.classList.add('fa-caret-down');
    }
}

saveButton.addEventListener('click', saveWindowListener);
openSavedWindowButton.addEventListener('click', openSavedWindowListener);
removeButton.addEventListener('click', removeWindowListener);
savedWindowsDropdownButton.addEventListener('click', savedWindowsDropdownButtonListener);
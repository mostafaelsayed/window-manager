async function getSelectedTabs() {
    return (await chrome.storage.local.get('selectedTabs'))['selectedTabs'];
}

chrome.runtime.connect({ name: 'mySidepanel' });

document.getElementById('save-selected-tabs-button').addEventListener('click', async (e) => {
    const windowName = document.getElementById('selectedTabsWindowName').value;

    let savedWindows = await getSavedWindows();
    console.log('window name to save: ', windowName);
    const windowTabs = await getSelectedTabs();
    console.log('popup windowTabs: ', windowTabs);
    let windowExists = savedWindows.findIndex(e => e.name == windowName) !== -1;
    if (windowExists) {
        if (!confirm(`Window with name '${windowName}' already exists. Overwrite it?`)) {
            return;
        }
    }
    
    let res = await chrome.runtime.sendMessage({ windowToSave: {
        name: windowName,
        tabs: windowTabs,
        current: false
    }});

    console.log('save res: ', res);

    if (res.status == 'failed') {
        return alert(res.message);
    }
    
    savedWindows = await getSavedWindows();
    console.log('final saved windows: ', savedWindows);
    alert('Window Saved Successfully!');
});
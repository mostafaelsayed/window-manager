async function settingTabClickListener() {
    await chrome.sidePanel.open({ windowId: (await getCurrentWindow()).id });
    await chrome.sidePanel.setOptions({
        path: '/settings-panel/settings-panel.html'
    });
}

async function mainTabClickListener() {
    await chrome.sidePanel.open({ windowId: (await getCurrentWindow()).id });
    await chrome.sidePanel.setOptions({
        path: '/main-side-panel/main-side-panel.html'
    });
}

async function backupButtonListener() {
    var element = document.createElement('a');
    const savedWindows = await getSavedWindows();
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedWindows)));
    element.setAttribute('download', 'window-manager-backup');
    element.click();
}

async function importInputChangeListener(e) {
    const file = e.target.files.item(0);
    if (!file) {
        return;
    }
    if (!confirm('Are you sure you want to import this backup?')) {
        e.target.value = null;
        return;
    }
    const text = await file.text();
    let importedBackup = JSON.parse(text);
    await persist({
        savedWindows: importedBackup
    });
    alert('Backup imported Successfully');
    e.target.value = null;
    await refresh();
}

getRefreshButton().addEventListener('click', refresh);
getMainTab().addEventListener('click', mainTabClickListener);
getBackupButton().addEventListener('click', backupButtonListener);
getSettingsTab().addEventListener('click', settingTabClickListener);
getImportBackupInput().addEventListener('change', importInputChangeListener);
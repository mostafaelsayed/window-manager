getRefreshButton().addEventListener('click', refresh);

getSettingsTab().addEventListener('click', async () => {
    await chrome.sidePanel.open({ windowId: (await getCurrentWindow()).id });
    await chrome.sidePanel.setOptions({
        path: '/settings-panel/settings-panel.html'
    });
});

getMainTab().addEventListener('click', async () => {
    await chrome.sidePanel.open({ windowId: (await getCurrentWindow()).id });
    await chrome.sidePanel.setOptions({
        path: '/main-side-panel/main-side-panel.html'
    });
});

getBackupButton().addEventListener('click', async () => {
    var element = document.createElement('a');
    const savedWindows = await getSavedWindows();
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedWindows)));
    element.setAttribute('download', 'window-manager-backup');
    element.click();
});

getImportBackupInput().addEventListener('change', async (e) => {
    const file = e.target.files.item(0);
    if (!file) {
        return;
    }
    if (!confirm('Are you sure you want to import this backup?')) {
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
});
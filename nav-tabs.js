document.getElementById('refresh').addEventListener('click', refresh);

document.getElementById('settings-tab').addEventListener('click', async () => {
    await chrome.sidePanel.open({ windowId: (await getCurrentWindow()).id });
    await persist({
        currentPannel: 'settings'
    });
    await chrome.sidePanel.setOptions({
        path: 'settings.html'
    });
});


document.getElementById('main-tab').addEventListener('click', async () => {
    await chrome.sidePanel.open({ windowId: (await getCurrentWindow()).id });
    await persist({
        currentPannel: 'side-panel'
    });
    await chrome.sidePanel.setOptions({
        path: 'side-panel.html'
    });
});

document.getElementById('backup').addEventListener('click', async () => {
    var element = document.createElement('a');
    const savedWindows = await getSavedWindows();
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedWindows)));
    element.setAttribute('download', 'window-manager-backup');
    element.click();
});

document.getElementById('import').addEventListener('change', async (e) => {
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
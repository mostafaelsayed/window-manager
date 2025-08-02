document.getElementById('backup').addEventListener('click', async () => {
    var element = document.createElement('a');
    const savedWindows = await getSavedWindows();
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedWindows)));
    element.setAttribute('download', 'window-manager-backup');
    element.click();
});

let importedBackup = undefined;

document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files.item(0);
    if (!file) {
        return;
    }
    const text = await file.text();
    importedBackup = JSON.parse(text);
    document.getElementById('import-button').style.display = 'inline-block';
});


document.getElementById('refresh-from-settings').addEventListener('click', refresh);

document.getElementById('main-tab-2').addEventListener('click', async () => {
    await chrome.sidePanel.open({ windowId: (await getCurrentWindow()).id });
    await chrome.sidePanel.setOptions({
        path: 'side-panel.html'
    });
});


chrome.runtime.connect({ name: 'settings-panel' });

document.getElementById('import-button').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to import this backup?')) {
        return;
    }
    await persist({
        savedWindows: importedBackup
    });
    importedBackup = undefined;
    document.getElementById('import-button').style.display = 'none';
    alert('Saved Windows Imported Successfully!');
    refresh();
});
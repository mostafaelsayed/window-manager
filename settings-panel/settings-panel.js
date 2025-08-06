chrome.runtime.connect({ name: 'settings-panel' });

loadNavTabs('settings-panel');

async function onloadListener() {
    console.log('loaded');
    await checkDarkModeState('settings-panel');
}

document.body.onload = onloadListener;

document.getElementById('dark-mode-icon').addEventListener('click', async (e) => {
    let current = (await chrome.storage.local.get('darkMode'))['darkMode'];

    if (current !== true) {
        await persist({
            darkMode: true
        });
        document.body.style.backgroundColor = 'black';
        document.body.style.color = 'white';
        document.getElementById('dark-mode-text').innerText = 'Light Mode';
        document.getElementById('dark-mode-icon').classList.remove('fa-moon');
        document.getElementById('dark-mode-icon').classList.add('fa-sun');
        document.getElementById('dark-mode-icon').classList.remove('fa-solid');
        document.getElementById('dark-mode-icon').classList.add('fa-regular');
    }
    else {
        await removeFromStorage('darkMode');
        document.body.style.backgroundColor = 'white';
        document.body.style.color = 'black';
        document.getElementById('dark-mode-text').innerText = 'Dark Mode';
        document.getElementById('dark-mode-icon').classList.remove('fa-sun');
        document.getElementById('dark-mode-icon').classList.add('fa-moon');
        document.getElementById('dark-mode-icon').classList.remove('fa-regular');
        document.getElementById('dark-mode-icon').classList.add('fa-solid');
    }
});
function dropdownSelected(e) {
    selectedWindowName = e.target.innerText;
    getSavedWindowsDropdownButton().innerHTML = selectedWindowName;
    getSavedWindowsDropdown().style.display = 'none';
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

async function updateSelectedWindowNamePlaceholder() {
    const currentSelectedWindow = await getCurrentSelectedWindow();
    if (currentSelectedWindow && currentSelectedWindow.name) {
        getSelectedWindowNamePlaceholder().innerText = "You are now in the window named '" + currentSelectedWindow.name + "'";
    }
}
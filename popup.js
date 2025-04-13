// Adicionar nota
document.getElementById('addNoteBtn').addEventListener('click', () => {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            browser.tabs.sendMessage(tabs[0].id, { action: "createNewNote" });
            window.close();
        });
});

// Ver notas
document.getElementById('viewNotesBtn').addEventListener('click', () => {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            const domain = new URL(tabs[0].url).hostname;
            browser.runtime.sendMessage({
                action: "getSiteNotes",
                domain: domain
            })
                .then(response => {
                    if (response && response.notes && response.notes.length > 0) {
                        alert(`Este site tem ${response.notes.length} nota(s)`);
                    } else {
                        alert("Não há notas para este site");
                    }
                });
        });
});

// Abrir página de opções
document.getElementById('optionsBtn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
    window.close();
});
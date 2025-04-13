// Importar o módulo de sticky notes
import StickyNotesModule from './js/ui/stickyNotes.js';

// Inicializar o módulo quando a página carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    StickyNotesModule.init();
});

// Também inicializar se o documento já estiver carregado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    StickyNotesModule.init();
}

// Adicionar ao final do arquivo contentScript.js
browser.runtime.onMessage.addListener((message) => {
    if (message.action === "createNewNote") {
        StickyNotesModule.createNewNote();
        return Promise.resolve({ success: true });
    }
});
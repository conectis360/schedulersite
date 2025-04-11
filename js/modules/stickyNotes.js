/**
 * Módulo para gerenciar notas adesivas (sticky notes) para sites
 */
const StickyNotesModule = (() => {
    // Elementos do DOM
    let notesContainer;
    let currentDomain = '';

    /**
     * Inicializa o módulo de notas
     */
    const init = () => {
        // Verificar se estamos em uma página web (não na página de opções)
        if (document.body && !window.location.href.includes('chrome-extension://')) {
            // Obter o domínio atual
            currentDomain = new URL(window.location.href).hostname;

            // Criar container para notas
            createNotesContainer();

            // Carregar notas para este domínio
            loadNotesForDomain(currentDomain);
        }
    };

    /**
     * Cria o container para as notas
     */
    const createNotesContainer = () => {
        // Verificar se já existe
        if (document.getElementById('sticky-notes-container')) {
            return;
        }

        // Criar container
        notesContainer = document.createElement('div');
        notesContainer.id = 'sticky-notes-container';
        notesContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;

        // Adicionar ao body
        document.body.appendChild(notesContainer);

        // Adicionar botão para criar nova nota
        const addButton = document.createElement('button');
        addButton.id = 'add-sticky-note-btn';
        addButton.innerHTML = '+';
        addButton.title = 'Adicionar nota';
        addButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #4285f4;
            color: white;
            font-size: 24px;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            pointer-events: auto;
        `;

        addButton.addEventListener('click', () => {
            createNewNote();
        });

        document.body.appendChild(addButton);

        // Adicionar estilos CSS
        const styles = document.createElement('style');
        styles.textContent = `
            .sticky-note {
                position: absolute;
                min-width: 200px;
                min-height: 150px;
                padding: 15px;
                box-shadow: 0 3px 6px rgba(0,0,0,0.16);
                border-radius: 2px;
                cursor: move;
                pointer-events: auto;
                font-family: Arial, sans-serif;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .sticky-note-header {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 5px;
            }
            
            .sticky-note-content {
                flex-grow: 1;
                outline: none;
                border: none;
                background: transparent;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .sticky-note-btn {
                background: transparent;
                border: none;
                color: rgba(0,0,0,0.5);
                cursor: pointer;
                font-size: 16px;
                margin-left: 5px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .sticky-note-btn:hover {
                background-color: rgba(0,0,0,0.1);
            }
        `;

        document.head.appendChild(styles);
    };

    /**
     * Carrega as notas para um domínio específico
     * @param {string} domain - Domínio para carregar as notas
     */
    const loadNotesForDomain = (domain) => {
        browser.runtime.sendMessage({
            action: "getSiteNotes",
            domain: domain
        })
            .then(response => {
                if (response && response.notes) {
                    // Renderizar cada nota
                    response.notes.forEach(note => {
                        renderNote(note);
                    });
                }
            })
            .catch(error => {
                console.error("Erro ao carregar notas:", error);
            });
    };

    /**
     * Cria uma nova nota
     */
    const createNewNote = () => {
        const note = {
            id: 'note-' + Date.now(),
            text: '',
            color: getRandomNoteColor(),
            position: {
                x: Math.max(100, Math.random() * (window.innerWidth - 300)),
                y: Math.max(100, Math.random() * (window.innerHeight - 300))
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Renderizar a nota
        renderNote(note);

        // Salvar a nota
        saveNote(note);
    };

    /**
     * Renderiza uma nota na tela
     * @param {Object} note - Objeto da nota
     */
    const renderNote = (note) => {
        // Criar elemento da nota
        const noteElement = document.createElement('div');
        noteElement.className = 'sticky-note';
        noteElement.id = note.id;
        noteElement.style.backgroundColor = note.color;
        noteElement.style.left = `${note.position.x}px`;
        noteElement.style.top = `${note.position.y}px`;

        // Cabeçalho da nota
        const header = document.createElement('div');
        header.className = 'sticky-note-header';

        // Botão de cor
        const colorBtn = document.createElement('button');
        colorBtn.className = 'sticky-note-btn';
        colorBtn.innerHTML = '🎨';
        colorBtn.title = 'Mudar cor';
        colorBtn.addEventListener('click', () => {
            changeNoteColor(note.id);
        });

        // Botão de excluir
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'sticky-note-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Excluir nota';
        deleteBtn.addEventListener('click', () => {
            deleteNote(note.id);
        });

        header.appendChild(colorBtn);
        header.appendChild(deleteBtn);

        // Conteúdo da nota
        const content = document.createElement('div');
        content.className = 'sticky-note-content';
        content.contentEditable = true;
        content.textContent = note.text;
        content.addEventListener('blur', () => {
            updateNoteText(note.id, content.textContent);
        });

        // Montar a nota
        noteElement.appendChild(header);
        noteElement.appendChild(content);

        // Adicionar ao container
        notesContainer.appendChild(noteElement);

        // Tornar a nota arrastável
        makeNoteDraggable(noteElement);
    };

    /**
     * Torna uma nota arrastável
     * @param {HTMLElement} noteElement - Elemento DOM da nota
     */
    const makeNoteDraggable = (noteElement) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        noteElement.addEventListener('mousedown', dragMouseDown);

        function dragMouseDown(e) {
            // Ignorar se o clique foi em um botão ou no conteúdo editável
            if (e.target.className === 'sticky-note-btn' ||
                e.target.className === 'sticky-note-content') {
                return;
            }

            e.preventDefault();
            // Obter posição do cursor
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Adicionar eventos para arrastar
            document.addEventListener('mousemove', elementDrag);
            document.addEventListener('mouseup', closeDragElement);
        }

        function elementDrag(e) {
            e.preventDefault();
            // Calcular nova posição
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Definir nova posição
            noteElement.style.top = (noteElement.offsetTop - pos2) + "px";
            noteElement.style.left = (noteElement.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // Parar de mover quando o mouse for solto
            document.removeEventListener('mousemove', elementDrag);
            document.removeEventListener('mouseup', closeDragElement);

            // Salvar a nova posição
            const noteId = noteElement.id;
            const position = {
                x: noteElement.offsetLeft,
                y: noteElement.offsetTop
            };

            updateNotePosition(noteId, position);
        }
    };

    /**
     * Salva uma nova nota
     * @param {Object} note - Objeto da nota
     */
    const saveNote = (note) => {
        browser.runtime.sendMessage({
            action: "addSiteNote",
            domain: currentDomain,
            note: note
        })
            .catch(error => {
                console.error("Erro ao salvar nota:", error);
            });
    };

    /**
     * Atualiza o texto de uma nota
     * @param {string} noteId - ID da nota
     * @param {string} text - Novo texto
     */
    const updateNoteText = (noteId, text) => {
        browser.runtime.sendMessage({
            action: "updateSiteNote",
            domain: currentDomain,
            noteId: noteId,
            updates: {
                text: text,
                updatedAt: new Date().toISOString()
            }
        })
            .catch(error => {
                console.error("Erro ao atualizar texto da nota:", error);
            });
    };

    /**
     * Atualiza a posição de uma nota
     * @param {string} noteId - ID da nota
     * @param {Object} position - Nova posição {x, y}
     */
    const updateNotePosition = (noteId, position) => {
        browser.runtime.sendMessage({
            action: "updateSiteNote",
            domain: currentDomain,
            noteId: noteId,
            updates: {
                position: position,
                updatedAt: new Date().toISOString()
            }
        })
            .catch(error => {
                console.error("Erro ao atualizar posição da nota:", error);
            });
    };

    /**
     * Muda a cor de uma nota
     * @param {string} noteId - ID da nota
     */
    const changeNoteColor = (noteId) => {
        const noteElement = document.getElementById(noteId);
        const newColor = getRandomNoteColor();

        noteElement.style.backgroundColor = newColor;

        browser.runtime.sendMessage({
            action: "updateSiteNote",
            domain: currentDomain,
            noteId: noteId,
            updates: {
                color: newColor,
                updatedAt: new Date().toISOString()
            }
        })
            .catch(error => {
                console.error("Erro ao atualizar cor da nota:", error);
            });
    };

    /**
     * Exclui uma nota
     * @param {string} noteId - ID da nota
     */
    const deleteNote = (noteId) => {
        const noteElement = document.getElementById(noteId);
        if (noteElement) {
            noteElement.remove();
        }

        browser.runtime.sendMessage({
            action: "deleteSiteNote",
            domain: currentDomain,
            noteId: noteId
        })
            .catch(error => {
                console.error("Erro ao excluir nota:", error);
            });
    };

    /**
     * Retorna uma cor aleatória para a nota
     * @returns {string} Cor em formato hexadecimal
     */
    const getRandomNoteColor = () => {
        const colors = [
            '#ffeb3b', // Amarelo
            '#ff9800', // Laranja
            '#4caf50', // Verde
            '#2196f3', // Azul
            '#e91e63', // Rosa
            '#9c27b0'  // Roxo
        ];

        return colors[Math.floor(Math.random() * colors.length)];
    };

    // API pública do módulo
    return {
        init
    };
})();

export default StickyNotesModule;
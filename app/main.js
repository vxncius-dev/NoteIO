class NoteIO {
  constructor() {
    this.container = document.getElementById("container");
    this.listView = document.getElementById("listView");
    this.newCard = document.getElementById("newCard");
    this.titleNote = document.getElementById("titleNote");
    this.noteContent = document.getElementById("noteContent");
    this.saveNewNote = document.getElementById("saveNewNote");
    this.closeDialog = document.getElementById("closeDialog");
    this.dialog = document.getElementById("dialog");
    this.menu = document.getElementById("menu-options");
    this.changeTheme = document.getElementById("changeTheme");
    this.clearAll = document.getElementById("clearAll");
    this.importData = document.getElementById("importData");
    this.exportData = document.getElementById("exportData");
    this.donate = document.getElementById("donate");
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', this.applySavedTheme);
    this.loadCards();
    this.addEventListeners();
  }

  toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('Codeblock-theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  }

  applySavedTheme() {
    const savedTheme = localStorage.getItem('Codeblock-theme');
    document.body.classList.toggle('light-mode', savedTheme === 'light');
  }

  insertPlaceholderIfNoNotes() {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    const placeholders = [
      {
        title: "Quick Guide: Adding Comments in JavaScript",
        content: `Use "//" for single-line comments and "/* ... */" for multi-line. Useful for debugging and documentation.`
      },
      {
        title: "Git Branching Basics",
        content: `To create a new branch: git branch <branch_name>. To switch: git checkout <branch_name>.`
      },
      {
        title: "Python Virtual Environment Setup",
        content: `Use python -m venv <env_name> to create an isolated environment for dependencies.`,
      },
      {
        title: "",
        content: `Organize ideas: Use sections, bullet points, or numbers to keep notes clean and focused.`
      },
      {
        title: "",
        content: `Remember to save your progress often. Losing work due to accidental closure can be frustrating.`,
      },
      {
        title: "Shortcut for Formatting in Markdown",
        content: `To format code in Markdown, wrap it in backticks: \`code\`, or triple backticks for multi-line code blocks.`
      },
      {
        title: "",
        content: `Note-taking Tip: Use headings and lists to keep your notes clear and easy to scan.`
      }
    ];

    if (Object.keys(noteList).length === 0) {
      const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
      const placeholderId = this.generateUUID();
      this.listView.innerHTML = `
            <li id="${placeholderId}" class="deactive">
                <div class="note-scope">
                    <p>${randomPlaceholder.title}</p>
                    <textarea readonly>${randomPlaceholder.content}
                    </textarea>
                </div>
                <button type="button" class="button-style outline">
                  <img src="./app/icons/clone.png" alt="icon" width="20" class="icon">
                </button>
            </li>
        `;
    }
  }

  buttonReset() {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    this.clearAll.disabled = Object.entries(noteList).length < 1;
    this.exportData.disabled = Object.entries(noteList).length < 1;
  }

  loadCards() {
    this.buttonReset()
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    this.listView.innerHTML = "";
    const sortedNotes = Object.entries(noteList).sort(
      (a, b) => b[1].timestamp - a[1].timestamp
    );

    sortedNotes.forEach(([id, noteItem]) => {
      const noteTitle = noteItem.title
        ? `<p contentEditable spellcheck="false">${noteItem.title}</p>`
        : "";

      this.listView.innerHTML += `
      <li id="${id}">
          <div class="note-scope">
              ${noteTitle}
              <textarea id="content-${id}"
                spellcheck="false">${noteItem.content}</textarea>
          </div>
          <button type="button" id="copy-${id}" class="button-style outline"
            data-title="Copy this note" aria-label="Copy this note">
            <img src="./app/icons/clone.png" alt="icon" width="20" class="icon">
          </button>
      </li>`;
    });

    this.copyButtonListener();
    this.textareaListeners();
    this.menuListenerFunction();
    this.insertPlaceholderIfNoNotes();
  }

  addEventListeners() {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    this.saveNewNote.addEventListener("click", () => this.addNote());
    this.noteContent.addEventListener("input", (e) =>
      this.managerSaveButtonStatus(e.target)
    );

    document
      .querySelectorAll(".menu-list li")
      .forEach(option => {
        option.addEventListener("click", () => {
          this.menu.checked = false;
        })
      })

    // document.addEventListener("click", (event) => {
    //   if (!event.target.closest(".menu-list") || !event.target.closest(".menu")) {
    //     event.stopPropagation();
    //     this.menu.checked = false;
    //   }
    // });

    document
      .querySelectorAll("#listView li p[contenteditable], #listView li textarea")
      .forEach((editableElement) => {
        editableElement.addEventListener("keyup", (e) => {
          const id = e.target.closest("li").id;
          if (e.target.tagName === "P") {
            noteList[id].title = e.target.innerText.trim();
          } else if (e.target.tagName === "textarea") {
            noteList[id].content = e.target.value;
          }
          this.saveNotes();
        });
      });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        const elements = ["#modal", "#menu", "#dialog"];
        elements.forEach(selector => {
          const el = document.querySelector(selector);
          if (el && getComputedStyle(el).display === "flex") {
            el.style.display = "none";
            document.getElementById("container").style.display = "flex";
            if (document.getElementById('modalContent')) document.getElementById('modalContent').remove();
          }
        });
      }
    });

    this.newCard.addEventListener("click", () => this.dialogControl(true));
    this.closeDialog.addEventListener("click", () => this.dialogControl(false));
    this.changeTheme.addEventListener("click", () => this.toggleTheme());
    this.clearAll.addEventListener("click", () => this.clearAllNotes());
    // importData
    this.exportData.addEventListener("click", () => this.downloadNotes());
    this.donate.addEventListener("click", () => this.donateModal());

    document.addEventListener('paste', (event) => {
      const pastedContent = event.clipboardData.getData('Text');
      let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
      const newNote = {
        title: "",
        content: pastedContent,
        timestamp: Date.now()
      };
      const noteId = this.generateUUID();
      noteList[noteId] = newNote;
      localStorage.setItem("Codeblock-notes", JSON.stringify(noteList));
      this.loadCards();
    });
  }

  downloadNotes() {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    const jsonContent = JSON.stringify(noteList, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Codeblock-notes.json";
    link.click();
  }

  dialogControl(show) {
    this.dialog.style.display = show ? "flex" : "none";
    this.container.style.display = show ? "none" : "flex";
  }

  saveNotes() {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    localStorage.setItem("Codeblock-notes", JSON.stringify(noteList));
    this.buttonReset()
  }

  managerSaveButtonStatus(el) {
    this.saveNewNote.disabled = el.value.length > 0 ? false : true;
  }

  copyButtonListener() {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    document.querySelectorAll("#listView li button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.id.replace("copy-", ""),
          contentNote = noteList[id].content;
        try {
          navigator.clipboard
            .writeText(contentNote)
            .then(() => {
              alert("Texto copiado para a área de transferência!");
            })
            .catch((error) => {
              alert(`Falha ao copiar texto para a área de transferência: ${error}`);
            });
        } catch (e) {
          console.log(e);
        }
      });
    });
  }

  textareaListeners() {
    document.querySelectorAll("li textarea").forEach((textArea) => {
      const adjustHeight = () => {
        textArea.style.height = "auto";
        const newHeight = textArea.scrollHeight;
        textArea.style.height = newHeight > 350 ? "350px" : `${newHeight}px`;
      };
      textArea.addEventListener("focus", () => adjustHeight());
      textArea.addEventListener("input", () => adjustHeight());
      textArea.addEventListener("blur", () => (textArea.style.height = "32px"));
      textArea.style.maxHeight = "350px";
    });
  }

  menuListenerFunction() {
    document.querySelectorAll("li").forEach((liElement) => {
      liElement.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const existingMenu = document.querySelector("#menu");
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement("div");
        menu.id = "menu";

        menu.innerHTML = `
          <button type="button" id="Delete" class="button-style outline"
            data-title="Delete this note" aria-label="Delete note">
            <p>Delete Note</p>
            <img src="./app/icons/trash.png" alt="icon" width="20" class="icon invert">
          </button>
          <button type="button" id="Share" class="button-style outline"
            data-title="Share this note" aria-label="Share note">
            <p>Share Note</p>
            <img src="./app/icons/share.png" alt="icon" width="20" class="icon invert">
          </button>
        `;

        liElement.appendChild(menu);
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        let menuX = e.pageX;
        let menuY = e.pageY;

        if (menuX + menuWidth > window.innerWidth) menuX = e.pageX - menuWidth;
        if (menuY + menuHeight > window.innerHeight) menuY = e.pageY - menuHeight;
        if (e.pageX > window.innerWidth * 0.8) menuX = e.pageX - menuWidth;

        menu.style.cssText = `
          left: ${menuX}px;
          top: ${menuY}px;
          position: absolute;
          display: flex;
          flex-direction: column;
          width: 120px;
        `;

        document.addEventListener("click", (closeMenuEvent) => {
          if (
            !menu.contains(closeMenuEvent.target) &&
            !liElement.contains(closeMenuEvent.target)
          ) {
            menu.remove();
          }
        });

        menu.querySelector("#Delete").addEventListener("click", () => {
          const id = liElement.id;
          this.deleteNote(id);
          menu.remove();
        });

        menu.querySelector("#Share").addEventListener("click", () => {
          const id = liElement.id;
          this.createShareDialog(id);
          menu.remove();
        });
      });
    });
  }

  deleteNote(id) {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    if (noteList[id]) {
      delete noteList[id];
      localStorage.setItem("Codeblock-notes", JSON.stringify(noteList));
    }
    this.loadCards()
    this.buttonReset()
  }

  createShareDialog(id) {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    let modal = document.getElementById("modal");
    modal.style.display = "flex";
    modal.innerHTML += `
        <div id="modalContent">
          <nav>
            <h2>Share note</h2>
            <button type="button" class="button-style outline"
              onclick="document.getElementById('modalContent').remove();
                document.getElementById('modal').style.display='none';"
              data-title="Close sharing menu" aria-label="Close share dialog">
                <img src="./app/icons/cross-small.png" alt="icon" width="20" class="icon">
              </button>
          </nav>
          <div class="share-content">
            <p id="text-outline" class="button-style outline">
              ${noteList[id].content}
            </p>
            
            <div class="button-group">
              <button type="button" class="button-style outline"
                onclick="window.open('https://wa.me/?text=${encodeURIComponent((noteList[id].title ? `*${noteList[id].title}*\n\n` : '') + noteList[id].content)}', '_blank')"
                data-title="Share via WhatsApp" aria-label="Share note on WhatsApp">
                <img src="./app/icons/whatsapp.png" alt="icon" width="20" class="icon">
              </button>
          
              <button type="button" class="button-style outline"
                onclick="window.location.href = 'mailto:?subject=${encodeURIComponent(noteList[id].title ? `<strong>${noteList[id].title}</strong>\n\n` : '')}&body=${encodeURIComponent(noteList[id].content)}'"
                data-title="Share via Email" aria-label="Send note via email">
                <img src="./app/icons/envelope.png" alt="icon" width="20" class="icon">
              </button>
            </div>
          </div>
        </div>`;
    this.closeModalOnClickOutside();
  }

  closeModal() {
    let modal = document.getElementById("modal")
    if (document.getElementById('modalContent')) document.getElementById('modalContent').remove();
    modal.style.display = "none";
  }

  closeModalOnClickOutside() {
    let modal = document.getElementById("modal")
    modal.addEventListener("click", (event) => {
      if (!event.target.closest('#modalContent')) {
        this.closeModal();
      }
    });
  }

  clearAllNotes() {
    let modal = document.getElementById("modal")
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    modal.style.display = "flex";
    modal.innerHTML = ` 
        <div id="modalContent">
          <nav>
            <span>
              <h2>Are you sure you want to delete all notes?</h2>
              <small>This action cannot be undone</small>
            </span>
          </nav>
          <div class="button-group end">
            <button type="button" class="button-style outline" id="cancelButton"
              data-title="Cancel deletion" aria-label="Cancel and close the modal">
              <p>Cancel</p>
            </button>
            <button type="button" class="button-style danger" id="confirmButton"
              data-title="Confirm deletion" aria-label="Permanently delete all notes">
              <p>Delete</p>
            </button>
          </div>
        </div>`;

    document.getElementById("cancelButton").addEventListener("click", this.closeModal);
    document.getElementById("confirmButton").addEventListener("click", () => {
      Object.keys(noteList).forEach((key) => delete noteList[key]);
      localStorage.setItem("Codeblock-notes", JSON.stringify(noteList));
      this.closeModal();
      this.loadCards();
    });
    modal.addEventListener("click", (event) => {
      if (!event.target.closest('#modalContent')) {
        this.closeModal();
      }
    });
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      let r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  addNote() {
    let noteList = JSON.parse(localStorage.getItem("Codeblock-notes")) || {};
    if (!this.noteContent.value) return;
    const newNote = {
      title: this.titleNote?.value || "",
      content: this.noteContent.value,
      timestamp: Date.now()
    };

    const noteId = this.generateUUID();
    noteList[noteId] = newNote;
    localStorage.setItem("Codeblock-notes", JSON.stringify(noteList));
    this.cancelDialog();
    this.loadCards();
  }

  cancelDialog() {
    this.titleNote.value = "";
    this.noteContent.value = "";
    this.dialogControl(false);
  }

  donateModal() {
    let modal = document.getElementById("modal");
    modal.style.display = "flex";
    modal.innerHTML += `
        <div id="modalContent">
          <nav>
            <span>
              <h2>Make a Donation</h2>
              <small>Thank you for your support! Your contribution makes a difference in keeping the project active.</small>
            </span>
          </nav>
          <div class="donation-methods">
            <div class="method">
              <p>Make your donation via Pix using the key below:</p>
              <span class="copyText button-style outline">
                <p id="pixKey">774aa4ae-69ec-4f2f-a774-0acb2074880f</p>
                <button type="button" class="button-style outline"
                  data-title="Copy this key" aria-label="Copy this key">
                  <img src="./app/icons/clone.png" alt="icon" width="20" class="icon" id="copy-pix">
                </button>
              </span>
            </div>
            <div class="method">
              <p>If you prefer to donate via Bitcoin, use the address below or the QR Code:</p>
              <span class="copyText button-style outline">
                <p id="bitcoinKey">1A2b3C4D5E6F7G8H9I0J</p>
                <button type="button" class="button-style outline"
                    data-title="Copy this address" aria-label="Copy this address">
                  <img src="./app/icons/clone.png" alt="icon" width="20" class="icon" id="copy-address">
                </button>
              </span>
            </div>
          </div>
          <small><em>Any amount is welcome! Thank you so much for your support.</em></small>
          <div class="button-group end">
            <button type="button" class="button-style outline"
              data-title="Close Modal" aria-label="Close the modal">
              <p>Close</p>
            </button>
          </div>
        </div>`;
    this.closeModalOnClickOutside();

    function resetCopyButton(id){
      setTimeout(() => document.getElementById(id).src = "./app/icons/clone.png", 5000)
    }

    const pixKeyButton = modal.querySelector("button[data-title='Copy this key']");
    pixKeyButton.addEventListener("click", () => {
      const pixKey = document.getElementById("pixKey").textContent;
      navigator.clipboard.writeText(pixKey).then(() => {
        document.getElementById("copy-pix").src = "./app/icons/check.png";
        resetCopyButton("copy-pix")
      }).catch(err => {
        console.error("Failed to copy: ", err);
      });
    });

    const bitcoinKeyButton = modal.querySelector("button[data-title='Copy this address']");
    bitcoinKeyButton.addEventListener("click", () => {
      const bitcoinKey = document.getElementById("bitcoinKey").textContent;
      navigator.clipboard.writeText(bitcoinKey).then(() => {
        document.getElementById("copy-address").src = "./app/icons/check.png"
        resetCopyButton("copy-address")
      }).catch(err => {
        console.error("Failed to copy: ", err);
      });
    });
  }
}

const noteManager = new NoteIO();

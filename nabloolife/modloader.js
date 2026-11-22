// Mod Loader adaptado para NaBlooLife
// Carga Chess Career y Gang Bang con toggles por id y soporte de dependencias

const MOD_LOADER = {
  version: "12",
  MODS: {
    chess: {
      path: "chess.js?v=5",
      deps: {
        engine: "chess-engine.js?v=2",
        puzzles: "chess-puzzles.js?v=2",
        events: "chess-events.js?v=2"
      }
    },
    gang: {
      path: "gang.js?v=5",
      deps: []
    }
  },
  enabled: {
    chess: false,
    gang: false
  },
  loaded: new Set(),

  init() {
    if (this.loaded.has("init")) return;
    this.loaded.add("init");
    
    // Verificar toggles guardados
    const saved = localStorage.getItem("modloader-enabled");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.enabled.chess = parsed.chess !== false;
        this.enabled.gang = parsed.gang !== false;
      } catch (e) {}
    }
    
    // Cargar mods habilitados
    if (this.enabled.chess) this.loadMod("chess");
    if (this.enabled.gang) this.loadMod("gang");
    
    // Agregar fila al menú
    this.addMenuRow();
  },

  loadMod(name) {
    if (this.loaded.has(name)) return;
    this.loaded.add(name);
    
    const mod = this.MODS[name];
    if (!mod) return false;
    
    // Cargar dependencias primero
    if (mod.deps) {
      for (const [key, depPath] of Object.entries(mod.deps)) {
        const script = document.createElement("script");
        script.src = depPath;
        script.async = false;
        document.head.appendChild(script);
      }
    }
    
    // Cargar el mod principal
    const script = document.createElement("script");
    script.src = mod.path;
    script.id = `mod-${name}`;
    script.addEventListener("load", () => {
      this.showToggleUI(name);
    });
    document.head.appendChild(script);
    
    return true;
  },

  showToggleUI(name) {
    const toggle = document.getElementById(`modloader-${name}`);
    if (toggle) return; // Ya existe
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mod-cell">${name}</td>
      <td><input type="checkbox" id="modloader-${name}" ${this.enabled[name] ? "checked" : ""} onchange="window.MOD_LOADER.toggle('${name}')"></td>
    `;
    
    // Insertar después de la fila de mods.js
    const target = document.querySelector('script[src="mods.js"]');
    if (target && target.nextElementSibling) {
      target.parentNode.insertBefore(row, target.nextElementSibling.nextSibling);
    } else if (target) {
      const tbody = target.parentNode;
      const lastRow = tbody.tBodies[0].rows[tbody.tBodies[0].rows.length - 1];
      tbody.insertBefore(row, lastRow.nextSibling);
    }
  },

  toggle(name) {
    this.enabled[name] = !this.enabled[name];
    localStorage.setItem("modloader-enabled", JSON.stringify(this.enabled));
    
    const script = document.getElementById(`mod-${name}`);
    if (this.enabled[name]) {
      if (!script) this.loadMod(name);
    } else {
      // Desactivar (ocultar o desloader)
      if (script) script.remove();
    }
    
    // Actualizar UI
    const checkbox = document.getElementById(`modloader-${name}`);
    if (checkbox) checkbox.checked = this.enabled[name];
  },

  addMenuRow() {
    // Esta función es llamada al init para agregar la fila "Mod Loader" al menú Special Careers
    const menu = document.querySelector('.career-table table');
    if (!menu) return;
    
    const row = document.createElement("tr");
    row.className = "mod-loader-row";
    row.innerHTML = `
      <td colspan="2" style="text-align:center; font-weight:bold; background:#e8f4fd; color:#1a1a1a;">
        Mod Loader NaBlooLife
      </td>
    `;
    
    // Insertar al inicio del table body
    const tbody = menu.tBodies[0];
    const firstRow = tbody.rows[0];
    tbody.insertBefore(row, firstRow);
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => MOD_LOADER.init());
else MOD_LOADER.init();
# CVitae SaaS: UI & Architecture Design Decisions

This document records the architectural and UI design decisions for the CVitae SaaS wrapper, detailing the split-pane layout, form-code toggling, and interactive SyncTeX syncing.

---

## 1. Core Architecture

The SaaS application serves as a wrapper around the **`cvitae` core engine** (integrated as a Git submodule at `core-engine/` and installed as a local path dependency in python).

* **Single Source of Truth**: The FastAPI backend (`backend/server.py`) imports directly from `backend` (the core engine packages). All schema models, PDF compilation routines (using Tectonic), and LaTeX templates are managed by the core engine.
* **Separation of Concerns**: The SaaS only manages the web layer (FastAPI routes, HTTP proxies) and the user interface (Next.js App Router).

---

## 2. Split-Pane Layout & Editor Views

The workspace is a robust, resizable two-pane layout using `react-resizable-panels`:
* **Right Pane**: Always displays the live PDF preview (rendered using `react-pdf`).
* **Left Pane**: Contains the editing workspace, featuring a toggle at the top:
  * **Code View**: A Monaco Editor configured in `yaml` mode, complete with autocomplete suggestions, validation squiggles, and hover tooltips generated from the CV JSON Schema.
  * **Form View**: A structured, user-friendly form with visual inputs (text fields, date pickers, drag-and-drop lists).
* **Sidebar (Far Left)**: A collapsible navigation panel exposing the stored variants (e.g. `General`, `ML Engineer`, `Academic`) and their active files (the selector file, the variant overrides file, and the base database).

---

## 3. Dynamic Form Generation via JSON Schema

To prevent high-maintenance custom UI code for each CV section:
1. The FastAPI backend exposes a JSON Schema generated directly from the Pydantic models.
2. The Next.js frontend uses **React JSON Schema Form (RJSF)** or a similar schema parser to dynamically render form inputs.
3. If CV schema fields change in the Python core engine, the SaaS form UI updates automatically without React code changes.

---

## 4. PDF-to-Editor Syncing (SyncTeX)

When a user double-clicks a section of text on the compiled PDF, the interface focuses and scrolls to the corresponding source content on the left pane:

```
[ PDF Double-Click ] ─► [ Send X, Y, Page ] ─► [ FastAPI resolves via SyncTeX ] 
                                                          │
[ Focus & Scroll ] ◄─── [ Return YAML Path ] ◄────────────┘
```

### Syncing Implementations:

#### A. Code View (Monaco)
1. The PDF is compiled with Tectonic's `--synctex=1` flag.
2. Double-clicking text in `react-pdf` sends the `(Page, X, Y)` coordinates to `/api/synctex-resolve`.
3. The backend resolves the coordinates to a line in the generated `.tex` file.
4. Using hidden LaTeX source-map comments (`% SOURCE: experience.instadeep.bullets.0`) outputted during Jinja2 template generation, the backend maps the `.tex` line back to the YAML path.
5. The frontend focuses Monaco, locates the YAML path, and scrolls to that line.

#### B. Form View
1. Dynamically generated form inputs are assigned unique HTML `id` attributes matching their data path (e.g., `id="form-experience-instadeep-bullets-0"`).
2. When the backend returns the YAML path, the frontend converts the path to the HTML ID format.
3. The browser runs:
   ```javascript
   const el = document.getElementById(formId);
   el.scrollIntoView({ behavior: 'smooth', block: 'center' });
   el.focus();
   ```
4. A temporary CSS focus animation (e.g., a colored border flash) highlights the field to guide the user.

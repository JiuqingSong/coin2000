import { subscribeLocale, t } from '../i18n';

export interface SaveDialogOptions {
  defaultName: string;
  // Trailing extension (e.g. ".map.coin"). When opening, everything before
  // this suffix is selected so the user edits just the basename.
  extension?: string;
  onSave(name: string): void;
  onCancel?(): void;
}

export interface SaveDialogHandle {
  open(opts: SaveDialogOptions): void;
  close(): void;
}

export function mountSaveDialog(parent: HTMLElement): SaveDialogHandle {
  const overlay = document.createElement('div');
  overlay.id = 'save-modal';
  overlay.hidden = true;

  const card = document.createElement('div');
  card.className = 'save-card';

  const title = document.createElement('h2');
  card.append(title);

  const row = document.createElement('label');
  row.className = 'save-row';
  const labelText = document.createTextNode('');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'save-name';
  input.spellcheck = false;
  input.autocomplete = 'off';
  row.append(labelText, input);
  card.append(row);

  const actions = document.createElement('div');
  actions.className = 'save-actions';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'primary';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  actions.append(saveBtn, cancelBtn);
  card.append(actions);

  overlay.append(card);
  parent.append(overlay);

  let pending: SaveDialogOptions | null = null;

  const applyLocale = () => {
    title.textContent = t('save.title');
    labelText.textContent = t('save.filename');
    saveBtn.textContent = t('save.btn.save');
    cancelBtn.textContent = t('save.btn.cancel');
  };
  applyLocale();
  subscribeLocale(applyLocale);

  const close = () => {
    overlay.hidden = true;
    pending = null;
  };

  const commit = () => {
    const p = pending;
    if (!p) return;
    close();
    p.onSave(input.value);
  };

  const cancel = () => {
    const p = pending;
    close();
    p?.onCancel?.();
  };

  saveBtn.addEventListener('click', commit);
  cancelBtn.addEventListener('click', cancel);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  });

  return {
    open(opts) {
      pending = opts;
      input.value = opts.defaultName;
      overlay.hidden = false;
      requestAnimationFrame(() => {
        input.focus();
        // Select the basename so the user can rename without deleting the
        // extension. Caller-supplied ext wins over the naive last-dot rule
        // because our extensions are compound (".map.coin", ".replay.coin").
        const v = input.value;
        const ext = opts.extension;
        const end =
          ext && v.toLowerCase().endsWith(ext.toLowerCase())
            ? v.length - ext.length
            : v.lastIndexOf('.');
        if (end > 0) input.setSelectionRange(0, end);
        else input.select();
      });
    },
    close,
  };
}

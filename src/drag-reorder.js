// Drag-to-reorder for the page strip and the imported-capture grid.
//
// The app re-renders on every state change, so nothing here touches state
// while a drag is in flight — the insertion hint is painted directly onto the
// DOM and only the final drop commits a move.

let dragFrom = null;

function clearHints(root) {
  (root || document).querySelectorAll(".drop-before, .drop-after")
    .forEach((el) => el.classList.remove("drop-before", "drop-after"));
}

// Which side of the target the item would land on, from the pointer position.
function hint(el, e) {
  const box = el.getBoundingClientRect();
  const before = e.clientX < box.left + box.width / 2;
  el.classList.toggle("drop-before", before);
  el.classList.toggle("drop-after", !before);
  return before;
}

/**
 * Makes one item draggable within its list.
 * `onMove(from, to)` receives indices in the list's own coordinates.
 */
export function draggableItem(el, index, onMove) {
  el.draggable = true;

  el.addEventListener("dragstart", (e) => {
    dragFrom = index;
    el.classList.add("dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      // Firefox only starts a drag once some data is set.
      e.dataTransfer.setData("text/plain", String(index));
    }
  });

  el.addEventListener("dragend", () => {
    dragFrom = null;
    el.classList.remove("dragging");
    clearHints();
  });

  el.addEventListener("dragover", (e) => {
    if (dragFrom === null || dragFrom === index) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    hint(el, e);
  });

  el.addEventListener("dragleave", () => {
    el.classList.remove("drop-before", "drop-after");
  });

  el.addEventListener("drop", (e) => {
    if (dragFrom === null) return;          // a file drop, not a reorder
    e.preventDefault();
    e.stopPropagation();
    const before = el.classList.contains("drop-before");
    const from = dragFrom;
    dragFrom = null;
    clearHints();
    if (from === index) return;

    let to = before ? index : index + 1;
    if (from < to) to -= 1;                 // account for removing the source
    if (to !== from) onMove(from, to);
  });
}

/**
 * Lets the empty space of a list accept a drop, moving the item to the end.
 */
export function draggableList(el, count, onMove) {
  el.addEventListener("dragover", (e) => {
    if (dragFrom === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  });

  el.addEventListener("drop", (e) => {
    if (dragFrom === null) return;
    e.preventDefault();
    const from = dragFrom;
    dragFrom = null;
    clearHints();
    if (from !== count - 1) onMove(from, count - 1);
  });
}

export function isReordering() {
  return dragFrom !== null;
}

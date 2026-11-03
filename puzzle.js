(() => {
  "use strict";

  const gate = document.querySelector("#puzzleGate");
  const board = document.querySelector("#puzzleBoard");
  const main = document.querySelector("#contenido");
  const skipLink = document.querySelector(".skip-link");
  const progressText = document.querySelector("#puzzleProgressText");
  const progressBar = document.querySelector("#puzzleProgressBar");
  const movesLabel = document.querySelector("#puzzleMoves");
  const status = document.querySelector("#puzzleStatus");
  const hintButton = document.querySelector("#puzzleHintBtn");
  const preview = document.querySelector("#puzzlePreview");
  const shuffleButton = document.querySelector("#puzzleShuffleBtn");
  const completePanel = document.querySelector("#puzzleComplete");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const solvedOrder = Array.from({ length: 9 }, (_, index) => index);

  let moves = 0;
  let selectedPiece = null;
  let dragging = false;
  let solved = false;
  let hintTimer = 0;
  let sortable = null;

  const shuffle = (values) => {
    const result = [...values];
    do {
      for (let index = result.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
      }
    } while (result.every((value, index) => value === index) || result.filter((value, index) => value === index).length > 3);
    return result;
  };

  const currentPieces = () => [...board.querySelectorAll(".puzzle-piece")];

  const hideHint = () => {
    window.clearTimeout(hintTimer);
    preview?.classList.remove("is-visible");
    preview?.setAttribute("aria-hidden", "true");
    hintButton?.setAttribute("aria-pressed", "false");
  };

  const unlockSite = () => {
    if (!gate || !main) return;
    document.body.classList.add("puzzle-unlocking");

    window.setTimeout(() => {
      document.body.classList.remove("puzzle-locked", "puzzle-unlocking");
      gate.hidden = true;
      gate.setAttribute("aria-hidden", "true");
      main.removeAttribute("inert");
      main.setAttribute("aria-hidden", "false");
      skipLink?.removeAttribute("tabindex");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.dispatchEvent(new CustomEvent("puzzle:unlocked"));
      main.focus({ preventScroll: true });
    }, reducedMotion ? 80 : 1050);
  };

  const finishPuzzle = () => {
    if (solved) return;
    solved = true;
    sortable?.option("disabled", true);
    currentPieces().forEach((piece) => {
      piece.disabled = true;
      piece.classList.add("is-correct");
    });
    hideHint();
    status.textContent = "Recuerdo completo.";
    completePanel?.classList.add("is-visible");
    completePanel?.setAttribute("aria-hidden", "false");
    gate?.classList.add("is-solved");
    document.dispatchEvent(new CustomEvent("puzzle:completed"));
    unlockSite();
  };

  const updateProgress = () => {
    const pieces = currentPieces();
    const correct = pieces.reduce((total, piece, index) => {
      const isCorrect = Number(piece.dataset.piece) === index;
      piece.classList.toggle("is-correct", isCorrect);
      return total + Number(isCorrect);
    }, 0);

    if (progressText) progressText.textContent = `${correct} de 9`;
    if (progressBar) progressBar.style.transform = `scaleX(${correct / 9})`;
    if (movesLabel) movesLabel.textContent = String(moves);

    if (correct === 9) finishPuzzle();
    else if (correct >= 6) status.textContent = "Casi está. Mira los pequeños detalles.";
    else if (correct >= 3) status.textContent = "Vas encontrando el recuerdo.";
    else status.textContent = moves ? "Prueba alineando primero los bordes." : "Busca primero las esquinas.";
  };

  const makePiece = (pieceIndex) => {
    const piece = document.createElement("button");
    const column = pieceIndex % 3;
    const row = Math.floor(pieceIndex / 3);
    piece.className = "puzzle-piece";
    piece.type = "button";
    piece.dataset.piece = String(pieceIndex);
    piece.style.setProperty("--piece-x", `${column * 50}%`);
    piece.style.setProperty("--piece-y", `${row * 50}%`);
    piece.setAttribute("aria-label", `Pieza ${pieceIndex + 1} de 9`);
    return piece;
  };

  const swapSelectedPieces = (secondPiece) => {
    if (!selectedPiece) {
      selectedPiece = secondPiece;
      secondPiece.classList.add("is-selected");
      secondPiece.setAttribute("aria-pressed", "true");
      status.textContent = "Ahora elige la pieza que ocupará su lugar.";
      return;
    }

    if (selectedPiece === secondPiece) {
      selectedPiece.classList.remove("is-selected");
      selectedPiece.removeAttribute("aria-pressed");
      selectedPiece = null;
      updateProgress();
      return;
    }

    const pieces = currentPieces();
    const firstIndex = pieces.indexOf(selectedPiece);
    const secondIndex = pieces.indexOf(secondPiece);
    [pieces[firstIndex], pieces[secondIndex]] = [pieces[secondIndex], pieces[firstIndex]];
    selectedPiece.classList.remove("is-selected");
    selectedPiece.removeAttribute("aria-pressed");
    board.replaceChildren(...pieces);
    selectedPiece = null;
    moves += 1;
    updateProgress();
  };

  const renderPuzzle = () => {
    solved = false;
    moves = 0;
    selectedPiece = null;
    completePanel?.classList.remove("is-visible");
    completePanel?.setAttribute("aria-hidden", "true");
    gate?.classList.remove("is-solved");
    board.replaceChildren(...shuffle(solvedOrder).map(makePiece));
    sortable?.option("disabled", false);
    updateProgress();
  };

  board?.addEventListener("click", (event) => {
    const piece = event.target.closest(".puzzle-piece");
    if (!piece || dragging || solved) return;
    swapSelectedPieces(piece);
  });

  hintButton?.addEventListener("click", () => {
    const willShow = !preview?.classList.contains("is-visible");
    hideHint();
    if (!willShow || !preview) return;
    preview.classList.add("is-visible");
    preview.setAttribute("aria-hidden", "false");
    hintButton.setAttribute("aria-pressed", "true");
    status.textContent = "Una mirada rápida…";
    hintTimer = window.setTimeout(() => {
      hideHint();
      updateProgress();
    }, 2600);
  });

  shuffleButton?.addEventListener("click", () => {
    hideHint();
    renderPuzzle();
    status.textContent = "Nuevo intento. Empieza por las esquinas.";
  });

  if (board && window.Sortable) {
    sortable = new window.Sortable(board, {
      animation: reducedMotion ? 0 : 190,
      delay: 70,
      delayOnTouchOnly: true,
      draggable: ".puzzle-piece",
      chosenClass: "is-dragging",
      ghostClass: "is-ghost",
      dragClass: "is-dragging",
      onStart: () => {
        dragging = true;
        selectedPiece?.classList.remove("is-selected");
        selectedPiece?.removeAttribute("aria-pressed");
        selectedPiece = null;
      },
      onEnd: (event) => {
        if (event.oldIndex !== event.newIndex) moves += 1;
        window.setTimeout(() => { dragging = false; }, 0);
        updateProgress();
      }
    });
  }

  const resetGate = () => {
    if (!gate || !main) return;
    document.body.classList.add("puzzle-locked");
    document.body.classList.remove("puzzle-unlocking");
    gate.hidden = false;
    gate.removeAttribute("aria-hidden");
    main.setAttribute("inert", "");
    main.setAttribute("aria-hidden", "true");
    skipLink?.setAttribute("tabindex", "-1");
    renderPuzzle();
    requestAnimationFrame(() => currentPieces()[0]?.focus({ preventScroll: true }));
  };

  window.addEventListener("pageshow", resetGate);
  resetGate();
})();

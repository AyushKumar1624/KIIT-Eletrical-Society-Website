// Native dialogs supply inert backgrounds; explicitly wrap Tab as well so a
// one-control detail view keeps focus inside rather than visiting browser chrome.
export function trapDialogTab(event) {
  if (event.key !== "Tab" || event.target.closest("dialog") !== event.currentTarget) return;
  const controls = [...event.currentTarget.querySelectorAll("button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])")].filter(el => el.getClientRects().length > 0);
  const target = event.shiftKey ? controls[controls.length - 1] : controls[0];
  const boundary = event.shiftKey ? controls[0] : controls[controls.length - 1];
  if (target && document.activeElement === boundary) { event.preventDefault(); event.stopPropagation(); target.focus(); }
}

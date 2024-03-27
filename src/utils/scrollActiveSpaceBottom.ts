// scroll active space to bottom
export const scrollActiveSpaceBottom = () => {
  const activeSpaceEl = document.getElementById('active-space-scrollable-container');

  if (!activeSpaceEl) return;
  activeSpaceEl.scrollBy({ behavior: 'smooth', top: activeSpaceEl.scrollHeight });
};

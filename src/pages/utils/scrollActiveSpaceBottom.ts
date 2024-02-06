// scroll active space to bottom
export const scrollActiveSpaceBottom = () => {
  const activeSpaceEl = document.getElementById('active-space-scrollable-container');

  if (!activeSpaceEl) return;
  console.log('🚀 ~ scrollActiveSpaceBottom ~ activeSpaceEl:', activeSpaceEl);
  activeSpaceEl.scrollBy({ behavior: 'smooth', top: activeSpaceEl.scrollHeight });
};

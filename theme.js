let theme = 'light';
try { theme = localStorage.getItem('control-gastos:theme') === 'dark' ? 'dark' : 'light'; } catch {}
const button = document.getElementById('theme');
function paintTheme() { document.documentElement.dataset.theme = theme; button.textContent = theme === 'dark' ? 'Claro' : 'Oscuro'; }
button.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('control-gastos:theme', theme); } catch {} paintTheme(); });
paintTheme();

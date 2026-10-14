let theme = 'light';
try { theme = localStorage.getItem('control-gastos:theme') === 'dark' ? 'dark' : 'light'; } catch {}
const button = document.getElementById('theme');
function paintTheme() { document.documentElement.dataset.theme = theme;
    // Keep Android/browser chrome aligned with the selected appearance.
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = theme === 'dark' ? '#111a22' : '#f5f6f8';
    let scheme = document.querySelector('meta[name="color-scheme"]');
    if (!scheme) { scheme = document.createElement('meta'); scheme.name = 'color-scheme'; document.head.append(scheme); }
    scheme.content = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111a22' : '#f5f6f8');
 button.textContent = theme === 'dark' ? 'Claro' : 'Oscuro'; }
button.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('control-gastos:theme', theme); } catch {} paintTheme(); });
paintTheme();

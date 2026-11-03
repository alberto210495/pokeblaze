// Loaded in <head>, before the page draws: applies a saved theme so there's no flash of the wrong one.
// It is a separate file (not inline code) so the Content Security Policy can forbid inline scripts.
try {
  var savedTheme = localStorage.getItem('pokeinfo-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
} catch (e) { /* storage blocked: follow the system theme */ }

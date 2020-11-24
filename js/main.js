'use strict';

(function() {
  document.addEventListener('DOMContentLoaded', function(){
    var currentTheme = localStorage.getItem('theme');
    var prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    if (!currentTheme && prefersDarkScheme) {
      currentTheme = 'dark'
    }

    var button = document.querySelector('.dark-mode');
    if (currentTheme === 'dark') {
      document.body.classList.add('theme-dark');
    }

    button.addEventListener('click', function(ev) {
      if (currentTheme === 'dark') {
        currentTheme = 'light';
        document.body.classList.remove('theme-dark');
      } else {
        currentTheme = 'dark';
        document.body.classList.add('theme-dark');
      }

      localStorage.setItem('theme', currentTheme);
      ev.preventDefault();
    });
  });
})();

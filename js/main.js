'use strict';

(function() {
  document.addEventListener('DOMContentLoaded', function(){
    var currentTheme = localStorage.getItem('theme');
    var button = document.querySelector('.dark-mode');
    if (currentTheme === 'dark') {
      document.body.classList.add('theme-dark');
    }

    button.addEventListener('click', function() {
      if (currentTheme === 'dark') {
        currentTheme = undefined;
        localStorage.removeItem('theme');
        document.body.classList.remove('theme-dark');
      } else {
        currentTheme = 'dark';
        localStorage.setItem('theme', currentTheme);
        document.body.classList.add('theme-dark');
      }
    });
  });
})();

/* IncubatorCopy bundle entry — single <script> per Incubator page.
   Synchronously injects the 4 niche packs + the loader so pages don't
   need 5 script tags each. Order matters: packs before loader. */
(function () {
  var src = (document.currentScript && document.currentScript.src) || '';
  var dir = src.replace(/[^/]+$/, '');
  ['agency.js', 'skincare.js', 'coaching.js', 'fitness.js', 'index.js'].forEach(function (f) {
    document.write('<script src="' + dir + f + '"><\/script>');
  });
})();

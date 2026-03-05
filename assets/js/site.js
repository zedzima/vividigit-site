/**
 * Site Bootstrap
 * Initializes the public-site modules in a fixed order.
 */
(function() {
    var app = window.VividigitApp = window.VividigitApp || {};

    app.initCore?.();
    app.initCart?.();
    app.initForms?.();
    app.initUi?.();
})();

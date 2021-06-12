const raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function (fn) {
    return window.setTimeout(fn, (1000 / 60));
};


module.exports = raf;

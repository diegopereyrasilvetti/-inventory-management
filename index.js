const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
document.querySelectorAll('img.zoomable').forEach(function (img) {
    img.addEventListener('click', function () {
        if (!window.matchMedia('(min-width: 1024px)').matches) return;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.showModal();
    });
});
lightbox.addEventListener('click', function () { lightbox.close(); });

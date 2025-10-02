const video = document.getElementById("video-thumb");
const fullscreenBtn = document.getElementById("fullscreen-btn");

// Botão abre o vídeo em tela cheia, sem reiniciar
fullscreenBtn.addEventListener("click", () => {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) { // Safari
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { // IE/Edge antigo
        video.msRequestFullscreen();
    }
});

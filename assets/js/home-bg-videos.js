// home-bg-videos.js
const YOUTUBE_VIDEO_IDS = [
  "MLwlUe-1iwA",
  "p0y7zhuDOOw",
  "p7se72fyNK8",
  "8lwm9m5Bc-s",
  "ki3qAtwCHw4",
  "8bp7ALZhM4M",
  "gBVt2IPcbzA",
  "Tq_74KoylxU"
];

let currentIndex = Math.floor(Math.random() * YOUTUBE_VIDEO_IDS.length);
let videoPlayers = [];

function createYouTubeIframe(id, hidden) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&showinfo=0&rel=0&enablejsapi=1`;
  iframe.className = 'bg-video-iframe';
  iframe.allow = 'autoplay; encrypted-media';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');
  if (hidden) iframe.style.display = 'none';
  return iframe;
}

function showVideo(index) {
  videoPlayers.forEach((iframe, i) => {
    iframe.style.display = (i === index) ? 'block' : 'none';
  });
}

function swapVideo() {
  let nextIndex = currentIndex;
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * YOUTUBE_VIDEO_IDS.length);
  }
  currentIndex = nextIndex;
  showVideo(currentIndex);
}

document.addEventListener('DOMContentLoaded', () => {
  const bgWrap = document.querySelector('.bg-video-wrap');
  YOUTUBE_VIDEO_IDS.forEach((id, i) => {
    const iframe = createYouTubeIframe(id, i !== currentIndex);
    bgWrap.appendChild(iframe);
    videoPlayers.push(iframe);
  });
  setInterval(swapVideo, 18000); // swap every 18 seconds
});

export function fitJobTitle(){
  const title = document.getElementById("jobTitle");
  if (!title) return;

  // Long, single-word titles must scale down instead of being split in half.
  title.style.fontSize = "";
  title.style.whiteSpace = "nowrap";

  let size = parseFloat(getComputedStyle(title).fontSize);
  const minimumSize = 15;
  const availableWidth = title.clientWidth;

  while (title.scrollWidth > availableWidth && size > minimumSize) {
    size -= 1;
    title.style.fontSize = `${size}px`;
  }

  // Restore normal word-to-word wrapping after the longest word fits.
  title.style.whiteSpace = "";
}

export function initTitle(){
  window.addEventListener("resize", fitJobTitle);
}

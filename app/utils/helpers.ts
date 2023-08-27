const fluidType = (minType: number, maxType: number, minScreen: number, maxScreen: number, lineHeightMultiplier: number) => {
  // 32px + (96 - 32) * ((100vw - 300px) / (2400 - 300))
  const fontSize = `calc(${minType}px + (${maxType} - ${minType}) * ((100vw - ${minScreen}px) / (${maxScreen} - ${minScreen})))`
  const lineHeight = `calc((${minType}px + (${maxType} - ${minType}) * ((100vw - ${minScreen}px) / (${maxScreen} - ${minScreen}))) * ${lineHeightMultiplier})`
  return {
    fontSize,
    lineHeight
  }
}

const formatDate = (date: any, locale: string, short?: string) => {
  if (short) {
    return new Date(date).toLocaleString(locale, { 'month': 'numeric', 'year': 'numeric' })
  }
  return new Date(date).toLocaleString(locale, { 'month': 'long', 'day': '2-digit', 'year': 'numeric' })
}

const isExternalLink = (url: string) => {
  const EXTERNAL_URL_RE = /^[a-z]+:/i;
  return EXTERNAL_URL_RE.test(url)
}

const getContrast = function (hexcolor: string){

	// If a leading # is provided, remove it
	if (hexcolor.slice(0, 1) === '#') {
		hexcolor = hexcolor.slice(1);
	}

	// If a three-character hexcode, make six-character
	if (hexcolor.length === 3) {
		hexcolor = hexcolor.split('').map(function (hex) {
			return hex + hex;
		}).join('');
	}

	// Convert to RGB value
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);

	// Get YIQ ratio
	var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

	// Check contrast
	return (yiq >= 128) ? 'black' : 'white';

};

function makeDivDraggable(draggableDiv: HTMLElement) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  function handleMouseDown(event: MouseEvent | TouchEvent) {
    event.preventDefault(); // Prevent default behavior for touch events
    event.stopPropagation();
    isDragging = true;

    if (event instanceof MouseEvent) {
      offsetX = event.clientX - draggableDiv.getBoundingClientRect().left;
      offsetY = event.clientY - draggableDiv.getBoundingClientRect().top;
    } else if (event instanceof TouchEvent && event.touches.length === 1) {
      offsetX = event.touches[0].clientX - draggableDiv.getBoundingClientRect().left;
      offsetY = event.touches[0].clientY - draggableDiv.getBoundingClientRect().top;
    }

    draggableDiv.style.pointerEvents = "none"; // Disable pointer events on the draggable div
  }

  function handleMouseMove(event: MouseEvent | TouchEvent) {
    event.preventDefault(); // Prevent default behavior for touch events
    event.stopPropagation();

    if (isDragging) {
      let clientX = 0;
      let clientY = 0;

      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if (event instanceof TouchEvent && event.touches.length === 1) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      const left = clientX - offsetX;
      const top = clientY - offsetY;
      draggableDiv.style.left = left + "px";
      draggableDiv.style.top = top + "px";
    }
  }

  function handleMouseUp() {
    isDragging = false;
    draggableDiv.style.pointerEvents = "auto"; // Enable pointer events on the draggable div
  }

  // Attach event listeners for mousedown, mousemove, and mouseup events
  draggableDiv.addEventListener("mousedown", handleMouseDown);
  draggableDiv.addEventListener("touchstart", handleMouseDown, { passive: false });
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("touchmove", handleMouseMove, { passive: false });
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("touchend", handleMouseUp);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}

function createMouseFollower(followerDiv: HTMLElement) {
  const supportsHover = window.matchMedia("(hover: hover)").matches;

  if (!supportsHover) {
    return; // Exit the function if the device doesn't support hover events (touch devices)
  }

  function handleMouseMove(event: MouseEvent) {
    const isClickableElement = event.target instanceof HTMLAnchorElement || event.target instanceof HTMLButtonElement;

    // Update the position of the follower div based on the mouse movement
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    followerDiv.style.left = mouseX + "px";
    followerDiv.style.top = mouseY + "px";

    if (isClickableElement) {
      followerDiv.style.transform = "scale(2) translateZ(0)";
    } else {
      followerDiv.style.transform = "scale(1) translateZ(0)";
    }
  }

  // Attach event listeners for mousemove, mouseenter, and mouseleave events
  document.addEventListener("mousemove", handleMouseMove);
  followerDiv.style.transition = "transform 0.7s ease"
}

function scatterDivsRandomly(parentId: string) {
  const parentDiv = document.getElementById(parentId);
  if (!parentDiv) {
    console.error(`Element with ID '${parentId}' not found.`);
    return;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const divs = parentDiv.querySelectorAll("div");

  divs.forEach((div: HTMLElement) => {
    const divWidth = div.offsetWidth;
    const divHeight = div.offsetHeight;

    const maxLeft = viewportWidth - divWidth;
    const maxTop = viewportHeight - divHeight;

    const randomLeft = Math.floor(Math.random() * maxLeft);
    const randomTop = Math.floor(Math.random() * maxTop);

    const boundedLeft = Math.max(0, randomLeft);
    const boundedTop = Math.max(0, randomTop);

    div.style.left = `${boundedLeft}px`;
    div.style.top = `${boundedTop}px`;
  });
}

function reduceOpacityOnHover(targetDivId: string) {
  const targetDiv = document.getElementById(targetDivId);
  if (!targetDiv) {
    console.error(`Element with ID '${targetDivId}' not found.`);
    return;
  }

  const divs = document.querySelectorAll("div");

  const initialScaleMap: Map<HTMLElement, string> = new Map();

  divs.forEach((div: HTMLElement) => {
    if (div.id.startsWith("id-")) {
      initialScaleMap.set(div, div.style.transform);

      div.addEventListener("mouseover", () => {
        if (div !== targetDiv) {
          targetDiv.style.transform = "scale(1)";
          divs.forEach((otherDiv: HTMLElement) => {
            if (
              otherDiv.id.startsWith("id-") &&
              otherDiv !== targetDiv &&
              otherDiv !== div // Exclude the current div from opacity change
            ) {
              targetDiv.style.transform = "scale(0.6)";
            }
          });
        }
      });

      div.addEventListener("mouseout", () => {
        if (div !== targetDiv) {
          targetDiv.style.opacity = "";
          divs.forEach((otherDiv: HTMLElement) => {
            if (
              otherDiv.id.startsWith("id-") &&
              otherDiv !== targetDiv &&
              otherDiv !== div // Exclude the current div from opacity change
            ) {
              otherDiv.style.transform = initialScaleMap.get(otherDiv) || "";
            }
          });
        }
      });
    }
  });
}

function getSlug (url: string) {
  let newUrl = new URL(url);
  let params = new URLSearchParams(newUrl.search);
  return params.get("content")
}

export {
  fluidType,
  formatDate,
  isExternalLink,
  getContrast,
  getSlug,
  makeDivDraggable,
  createMouseFollower,
  scatterDivsRandomly,
  reduceOpacityOnHover
}
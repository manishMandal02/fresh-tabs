// TODO - remove - not being used currently
// Function to convert emoji to image data URL
export const emojiToDataURL = (emoji: string, size = 54) => {
  const canvas = new OffscreenCanvas(size, size);

  const context = canvas.getContext('2d');

  // Draw the emoji on the canvas
  context.font = '48px sans-serif';
  context.fillText(emoji, 2, 48);

  // Get the ImageData object
  return context.getImageData(0, 0, canvas.width, canvas.height);
};

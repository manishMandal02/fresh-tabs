// Function to convert emoji to image data URL
export const emojiToDataURL = (emoji: string, size = 128) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.font = `${size}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(emoji, size / 2, size / 2);

  return canvas.toDataURL();
};

// copy text to clipboard
export const copyToClipboard = async (value: string) => {
  await window.navigator.clipboard.writeText(value);
};

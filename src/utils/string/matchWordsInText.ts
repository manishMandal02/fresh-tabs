export const matchWordsInText = (query: string, text: string) => {
  const buildSearchRegex = (query: string): RegExp => {
    const words = query.split(' ').map(word => `(?=.*\\b${word.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&')})`);
    const regexString = `^${words.join('')}.+$`;
    return new RegExp(regexString, 'i');
  };

  const regex = buildSearchRegex(query);
  return regex.test(text);
};

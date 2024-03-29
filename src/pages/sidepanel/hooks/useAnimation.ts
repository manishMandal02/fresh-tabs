export const useCustomAnimation = () => {
  // bounce div animation
  const bounce = {
    initial: { scale: 0, opacity: 0 },
    whileInView: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40, duration: 0.2 },
  };

  const slide = {
    initial: { opacity: 0, y: 100 },
    whileInView: {
      opacity: 1,
      y: 0,
    },
    exit: { opacity: 0, y: 100 },
    transition: { type: 'spring', stiffness: 800, damping: 40, duration: 0.2 },
  };

  const fade = {
    initial: { opacity: 0 },
    whileInView: {
      opacity: 1,
    },
    exit: { opacity: 0 },
    transition: { type: 'tween', duration: 0.2 },
  };

  return { bounce, slide, fade };
};

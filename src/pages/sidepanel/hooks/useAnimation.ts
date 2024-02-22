export const useCustomAnimation = () => {
  // TODO - try a diff animation like slide down or left or fill. etc.
  // bounce div animation
  const bounce = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40, duration: 0.2 },
  };

  return { bounce };
};

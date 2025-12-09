import gsap from 'gsap';

export const fadeInUp = (element: Element, delay: number = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, delay, ease: 'power2.out' }
  );
};

export const staggerChildren = (parent: Element, selector: string, stagger: number = 0.1) => {
  return gsap.fromTo(
    parent.querySelectorAll(selector),
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, stagger, ease: 'back.out(1.7)' }
  );
};

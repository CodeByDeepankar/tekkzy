import React from 'react';

export interface CarouselItem {
  id: number;
  title: React.ReactNode;
  description: React.ReactNode;
  icon: React.ReactNode;
}

export interface CarouselProps {
  items?: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

declare const Carousel: React.FC<CarouselProps>;

export default Carousel;

"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SECTION_REVEAL_SELECTOR =
  ".section-header, .contact-form, .contact-info-card, .legal-box, .info-item, .form-group";

const CARD_REVEAL_SELECTOR = ".service-card, .message-card";

export default function ScrollEffects() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // Keep hero content alive with subtle scroll depth without changing layout.
      const heroContent = document.querySelector<HTMLElement>(".hero-content");
      if (heroContent) {
        gsap.to(heroContent, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
          },
        });
      }

      // Stagger content blocks when they enter viewport.
      ScrollTrigger.batch(SECTION_REVEAL_SELECTOR, {
        start: "top 86%",
        once: true,
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            {
              autoAlpha: 0,
              y: 34,
              filter: "blur(8px)",
            },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.85,
              ease: "power3.out",
              stagger: 0.1,
              overwrite: true,
            }
          );
        },
      });

      // Card reveal with perspective for a deeper scroll experience.
      ScrollTrigger.batch(CARD_REVEAL_SELECTOR, {
        start: "top 88%",
        once: true,
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            {
              autoAlpha: 0,
              y: 44,
              rotateX: 9,
              transformPerspective: 900,
            },
            {
              autoAlpha: 1,
              y: 0,
              rotateX: 0,
              duration: 0.95,
              ease: "power3.out",
              stagger: 0.12,
              overwrite: true,
            }
          );
        },
      });

      // Scroll-linked image parallax on existing image containers.
      gsap
        .utils
        .toArray<HTMLElement>(".about-image img, .message-image img")
        .forEach((img) => {
          gsap.fromTo(
            img,
            { yPercent: -8, scale: 1.08 },
            {
              yPercent: 8,
              scale: 1.02,
              ease: "none",
              scrollTrigger: {
                trigger: img,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.25,
              },
            }
          );
        });

      // Subtle endless icon motion to add life without visual redesign.
      gsap.utils.toArray<HTMLElement>(".service-icon").forEach((icon, index) => {
        gsap.to(icon, {
          y: -7,
          duration: 2.1 + index * 0.12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // Gentle card drift as user scrolls through content.
      gsap
        .utils
        .toArray<HTMLElement>(".service-card, .message-card")
        .forEach((card) => {
          gsap.fromTo(
            card,
            { y: 0 },
            {
              y: -12,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });

      // Footer entrance for a polished end-of-page motion beat.
      const footerColumns = gsap.utils.toArray<HTMLElement>(
        ".footer-grid > .footer-info, .footer-grid > .footer-column"
      );

      if (footerColumns.length > 0) {
        gsap.fromTo(
          footerColumns,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            ease: "power2.out",
            stagger: 0.09,
            scrollTrigger: {
              trigger: "footer",
              start: "top 92%",
              once: true,
            },
          }
        );
      }

      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert();
    };
  }, [pathname]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";

const FILMS = [
  { slug: "film-static", title: "Static — M. Reyes" },
  { slug: "film-neon-exit", title: "Neon Exit — K. Osei" },
  { slug: "film-redline", title: "Redline — J. Park" },
  { slug: "film-afterglow", title: "Afterglow — S. Lindqvist" },
];

export default function Home() {
  const [activeFilm, setActiveFilm] = useState(0);
  const goNext = () => setActiveFilm((i) => (i + 1) % FILMS.length);
  const goPrev = () => setActiveFilm((i) => (i - 1 + FILMS.length) % FILMS.length);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
    CustomEase.create("verticalEase", "0.65, 0, 0.35, 1");

    /* ===================== Lenis smooth scroll + ScrollTrigger bridge ===================== */
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /* ===================== Loader ===================== */
    const grid = document.getElementById("loader-tile-grid");
    const tiles = 32;
    for (let i = 0; i < tiles; i++) {
      grid.appendChild(document.createElement("div"));
    }
    gsap.to("#loader-tile-grid > div", {
      opacity: 0,
      stagger: { each: 0.015, from: "center" },
      delay: 0.3,
      duration: 0.5,
    });
    gsap.to(".loader", {
      delay: 0.9,
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        document.querySelector(".loader").classList.add("is-hidden");
        document.querySelectorAll(".hero-in").forEach((el, i) => {
          gsap.to(el, {
            delay: i * 0.1,
            duration: 0.01,
            onStart: () => el.classList.add("is-visible"),
          });
        });
        ScrollTrigger.refresh();
      },
    });

    /* ===================== Nav toggle ===================== */
    const navButtons = document.querySelectorAll("[data-nav-toggle]");
    const onNavClick = (e) => {
      const action = e.currentTarget.dataset.navToggle;
      if (action === "toggle") document.body.classList.toggle("nav-open");
      if (action === "close") document.body.classList.remove("nav-open");
    };
    navButtons.forEach((btn) => btn.addEventListener("click", onNavClick));

    /* ===================== Anchor links: route through Lenis so it doesn't snap back ===================== */
    const onAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      document.body.classList.remove("nav-open");
      lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    };
    document.addEventListener("click", onAnchorClick);

    /* ===================== Grid overlay toggle (` key) ===================== */
    const onKeyDown = (e) => {
      if (e.key === "`") document.getElementById("grid-overlay").classList.toggle("active");
    };
    window.addEventListener("keydown", onKeyDown);

    /* ===================== Reveal-up on enter (generic) ===================== */
    document.querySelectorAll(".reveal-up").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        onEnter: () => el.classList.add("is-visible"),
        once: true,
      });
    });

    /* ===================== Split words reveal ===================== */
    const splitInstances = [];
    document.querySelectorAll("[data-split-words]").forEach((el) => {
      const split = new SplitText(el, { type: "words", wordsClass: "split-word" });
      splitInstances.push(split);
      gsap.set(split.words, { opacity: 0, y: 12 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        end: "top 40%",
        scrub: true,
        onUpdate: (self) => {
          gsap.to(split.words, {
            opacity: (i) => (self.progress > i / split.words.length ? 1 : 0.15),
            y: (i) => (self.progress > i / split.words.length ? 0 : 12),
            stagger: 0.02,
            overwrite: "auto",
            duration: 0.3,
          });
        },
      });
    });

    /* ===================== HERO: one-time reveal on load ===================== */
    const heroTiles = gsap.utils.toArray(".tile");

    const heroTl = gsap.timeline({ delay: 1 }).to(heroTiles, {
      xPercent: 0,
      yPercent: 0,
      ease: "power3.out",
      duration: 1.4,
      stagger: 0.03,
    });

    const logoFadeST = ScrollTrigger.create({
      trigger: "#footer-section",
      start: "top bottom",
      onEnter: () => (document.getElementById("logo-wrapper").style.opacity = 0),
      onLeaveBack: () => (document.getElementById("logo-wrapper").style.opacity = 1),
    });

    /* ===================== SERVICES: pull up slightly under sticky hero ===================== */
    const servicesTween = gsap.to("#services-section", {
      yPercent: -6,
      ease: "none",
      scrollTrigger: {
        trigger: "#services-section",
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    });

    /* ===================== Card tilt (mousemove 3D tilt) ===================== */
    const tiltCards = document.querySelectorAll(".cardTilt");
    const tiltHandlers = [];
    tiltCards.forEach((card) => {
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: px * 10, rotateX: -py * 10, duration: 0.4, ease: "power2.out" });
      };
      const onLeaveCard = () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power3.out" });
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeaveCard);
      tiltHandlers.push({ card, onMove, onLeaveCard });
    });

    /* ===================== CTA: pinned logo zoom ===================== */
    const logoZoomTween = gsap.to("#logo-zoom", {
      scale: 5,
      ease: "none",
      scrollTrigger: {
        trigger: "#scale-section",
        start: "top center",
        end: "bottom bottom",
        scrub: true,
      },
    });

    /* ===================== CTA: stacked image trail follows cursor ===================== */
    const trailArea = document.querySelector("[data-stacked-trail-area]");
    const ctaSection = document.getElementById("cta-section");
    let lastTrailTime = 0;
    const onCtaMouseMove = (e) => {
      const now = Date.now();
      if (now - lastTrailTime < 90) return;
      lastTrailTime = now;
      const r = trailArea.getBoundingClientRect();
      const card = document.createElement("div");
      card.className = "trail-card";
      card.style.left = `${e.clientX - r.left}px`;
      card.style.top = `${e.clientY - r.top}px`;
      trailArea.appendChild(card);
      gsap
        .timeline({ onComplete: () => card.remove() })
        .to(card, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" })
        .to(card, { opacity: 0, scale: 0.7, duration: 0.5, ease: "power2.in" }, 0.15);
    };
    if (trailArea && ctaSection) ctaSection.addEventListener("mousemove", onCtaMouseMove);

    /* ===================== Footer canvas: lightweight particle network ===================== */
    const canvas = document.getElementById("footer-canvas");
    let ctx, w, h, particles, rafId;
    let onResize;
    if (canvas) {
      ctx = canvas.getContext("2d");
      const resize = () => {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
      };
      const init = () => {
        resize();
        const count = Math.floor((w * h) / 22000);
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        }));
      };
      const tick = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(155,140,255,0.6)";
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        });
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 110) {
              ctx.strokeStyle = `rgba(155,140,255,${0.12 * (1 - d / 110)})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
        rafId = requestAnimationFrame(tick);
      };
      init();
      onResize = () => init();
      window.addEventListener("resize", onResize);
      tick();
    }

    /* ===================== Cleanup ===================== */
    return () => {
      gsap.ticker.remove(raf);
      window.removeEventListener("keydown", onKeyDown);
      if (onResize) window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
      navButtons.forEach((btn) => btn.removeEventListener("click", onNavClick));
      document.removeEventListener("click", onAnchorClick);
      tiltHandlers.forEach(({ card, onMove, onLeaveCard }) => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeaveCard);
      });
      if (trailArea && ctaSection) ctaSection.removeEventListener("mousemove", onCtaMouseMove);
      splitInstances.forEach((s) => s.revert());
      ScrollTrigger.getAll().forEach((st) => st.kill());
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {/* Grid overlay (debug guides, toggled via ` key) */}
      <div id="grid-overlay">
        <div className="container h-full grid grid-cols-12 gap-6">
          <div className="col-span-1 bg-white/5" style={{ gridColumn: "span 1" }}></div>
        </div>
      </div>

      {/* Loader */}
      <div className="loader fixed inset-0 z-[100] bg-ink flex items-center justify-center">
        <div id="loader-tile-grid" className="absolute inset-0 grid grid-cols-8 pointer-events-none"></div>
        <span className="relative z-10 font-mono text-xs tracking-widest text-white/60">LOADING</span>
      </div>

      <main id="main">
        {/* Nav overlay */}
        <div
          className="nav-overlay fixed inset-0 z-40 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300"
          data-nav-toggle="close"
        ></div>

        {/* Logo (fixed, scales/fades with hero scroll) */}
        <div className="logo fixed inset-0 z-50 container py-6 lg:py-9 h-screen pointer-events-none flex flex-col" id="logo-wrapper">
          <a href="#" className="pointer-events-auto inline-flex items-center gap-3 w-[64px] md:w-[150px] overflow-hidden transition-[width,opacity] duration-300" id="logo-link">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-[36px] h-[36px] shrink-0 text-white">
              <circle cx="42" cy="42" r="30" stroke="currentColor" strokeWidth="8" />
              <line x1="64" y1="64" x2="92" y2="92" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
            </svg>
            <span className="font-display font-medium text-xl tracking-tight text-white whitespace-nowrap">Loupe</span>
          </a>
        </div>

        {/* Nav toggle button */}
        <div className="fixed top-0 right-0 z-50 container py-6 lg:py-9 flex justify-end items-center pointer-events-none">
          <button data-nav-toggle="toggle" className="btn pointer-events-auto font-mono text-xs group">
            <span className="w-full px-3 py-2 rounded-full backdrop-blur-sm bg-black/60 border border-white/10 flex gap-3 justify-between items-center">
              <strong className="text-left">
                <span data-hover="CLOSE">MENU</span>
              </strong>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="nav-icon transition-transform duration-300">
                <line x1="6.36667" y1="0" x2="6.36667" y2="13" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="6.63333" x2="13" y2="6.63333" stroke="currentColor" strokeWidth="1" />
              </svg>
            </span>
          </button>
        </div>

        {/* Mega nav */}
        <div className="fixed z-[48] top-[var(--nav-height)] left-0 right-0 container main-nav pointer-events-none">
          <div className="bg-brand text-ink p-6 lg:p-10 rounded-b-2xl">
            <ul className="flex gap-6 lg:gap-10 justify-between max-sm:flex-col w-full">
              <li className="group">
                <span className="text-xl lg:text-2xl font-display">Watch</span>
                <ul className="mt-3 flex flex-col gap-1">
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#discover">Trending Shorts</a></li>
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#discover">Categories</a></li>
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#discover">New Creators</a></li>
                </ul>
              </li>
              <li className="group">
                <span className="text-xl lg:text-2xl font-display">Upload</span>
                <ul className="mt-3 flex flex-col gap-1">
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#upload">Submit a Film</a></li>
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#upload">Licensing</a></li>
                </ul>
              </li>
              <li><a href="#discover" className="text-xl lg:text-2xl font-display link-underline">Discover</a></li>
              <li><a href="#upload" className="text-xl lg:text-2xl font-display link-underline">Upload</a></li>
              <li className="group">
                <span className="text-xl lg:text-2xl font-display">About Us</span>
                <ul className="mt-3 flex flex-col gap-1">
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#">Who We Are</a></li>
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#">Contact Us</a></li>
                  <li><a className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[13px]" href="#">Careers</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        {/* ============ HERO ============ */}
        <div className="bg-ink" id="hero-wrapper">
          <section className="h-screen relative pointer-events-none overflow-hidden" id="home-hero">
            <span className="noise opacity-[0.04]"></span>

            <div className="absolute inset-0">
              <div className="max-md:absolute inset-0 md:relative flex justify-center items-center" id="hero-tiles">
                {[
                  ["-1", "-1", "retro-vinyl-turntable.jpg"],
                  ["-1", "0", "retro-vinyl-turntable.jpg"],
                  ["-1", "1", "neon-ski-night.jpg"],
                  ["0", "-1", "film-reel-flatlay.jpg"],
                  ["0", "1", "retro-rotary-phone.jpg"],
                  ["1", "-1", "boombox-hollywood-neon.jpg"],
                  ["1", "0", "neon-static-tv-duo.jpg"],
                  ["1", "1", "retro-tv-wall-arcade.jpg"],
                ].map(([offX, offY, file], i) => {
                  return (
                    <picture
                      key={`${file}-${i}`}
                      className="tile max-md:hidden absolute inset-0 flex justify-center bg-ink"
                      data-off-x={offX}
                      data-off-y={offY}
                      style={{ transform: `translate(${Number(offX) * 100}%, ${Number(offY) * 100}%)` }}
                    >
                      <div className="fill-image">
                        <img src={`/media/images/${file}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    </picture>
                  );
                })}

                <div className="w-screen h-screen opacity-80">
                  <div className="fill-image" id="hero-video">
                    <video
                      src="/media/videos/hero-loop.mp4"
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </div>
                </div>
              </div>

              {/* Hero text */}
              <div className="relative md:absolute inset-0 flex flex-col justify-center container pointer-events-none">
                <div className="grid md:grid-cols-12 w-full gap-6">
                  <div className="md:col-start-8 md:col-span-5 xl:col-start-10 xl:col-span-3">
                    <div className="hero-in">
                      <div className="h-20 md:hidden"></div>
                      <h1 className="font-display font-medium max-md:text-4xl text-5xl max-w-[12ch] mb-6 lg:mb-10 text-white" id="hero-heading">
                        <span className="opacity-60">Short films.</span> Shared with the world.
                      </h1>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative md:absolute inset-0 flex md:justify-center md:items-center pointer-events-none container">
                <div className="flex flex-col gap-10 pointer-events-auto md:text-center max-w-2xl mx-auto">
                  <div className="flex flex-col gap-8 hero-in">
                    <p className="text-xl leading-snug max-w-[38ch] mx-auto m-0 text-white" id="hero-sub">
                      <strong>Loupe</strong> is a home for short films — upload yours, or discover what creators around the world are making.
                    </p>
                    <div id="hero-cta">
                      <a href="#discover" className="btn">
                        <span className="w-full px-5 py-3 rounded-full bg-brand text-ink flex gap-8 justify-between items-center">
                          <strong>Watch Now</strong>
                          <svg width="8" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.350098 0.349976H6.7501V6.74998" stroke="currentColor" strokeWidth="1" strokeLinecap="square" /></svg>
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ============ SERVICES ============ */}
        <div className="bg-white text-ink relative">
          <div className="relative top-0 z-20" id="services-section">
            <span className="noise opacity-[0.03]"></span>
            <div className="min-h-screen container flex flex-col justify-between py-16">
              <section className="reveal-up">
                <h2 className="font-display text-4xl lg:text-6xl font-medium">What Loupe Does</h2>
                <div className="h-10 lg:h-16"></div>
              </section>

              <div className="flex items-center relative z-[2]">
                <div className="grid lg:grid-cols-12 gap-6 w-full">
                  <div className="lg:col-start-9 lg:col-span-4 flex flex-col gap-6">
                    <p className="text-xl max-w-[40ch] reveal-up">
                      Loupe exists because everyone has a story worth a few minutes of someone else&rsquo;s time. No algorithm deciding what gets seen first — just films, tagged and discoverable, from anyone willing to hit upload.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-0 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["01", "Upload", "retro-vinyl-turntable.jpg", "Share your short film in minutes"],
                  ["02", "Discover", "neon-static-tv-duo.jpg", "Browse curated shorts from creators worldwide"],
                  ["03", "Watch", "retro-tv-wall-arcade.jpg", "Stream instantly, completely free"],
                  ["04", "License", "film-reel-flatlay.jpg", "Choose exactly how it's shared"],
                ].map(([num, label, img, caption]) => (
                  <div className="flex" key={num}>
                    <a href="#" className="flex flex-col w-full group relative text-white">
                      <div className="aspect-square p-3 grow relative overflow-hidden">
                        <img
                          src={`/media/images/${img}`}
                          alt={label}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-colors duration-200" />
                        <p className="relative font-mono text-sm">{num}</p>
                        <div className="absolute bottom-0 left-0 p-3 w-full flex flex-col gap-1">
                          <p className="mb-0 text-base xl:text-lg leading-tight">{label}</p>
                          <p className="mb-0 text-xs opacity-80 leading-snug">{caption}</p>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============ AMBIENT VIDEO INTERLUDE ============ */}
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
          <video
            src="/media/videos/film-afterglow.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 container text-center max-w-3xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-widest text-brand mb-4">Why Loupe</p>
            <p className="font-display text-2xl lg:text-4xl font-medium text-white leading-snug">
              Every filmmaker starts somewhere small — a phone, a weekend, a story that wouldn&rsquo;t leave them alone. Loupe is where that first cut finds an audience.
            </p>
          </div>
        </section>

        <div className="relative z-10 w-full bg-ink flex items-center pointer-events-auto" id="projects-heading">
          <div className="container py-12 flex max-sm:flex-col gap-6 sm:items-center justify-between">
            <h2 className="text-brand font-display text-4xl lg:text-6xl font-medium" id="discover">Discover</h2>
            <a href="#projects-grid" className="btn">
              <span className="w-full px-5 py-3 rounded-full bg-brand text-ink flex gap-8 justify-between items-center">
                <strong>Browse All Shorts</strong>
                <svg width="8" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.350098 0.349976H6.7501V6.74998" stroke="currentColor" strokeWidth="1" strokeLinecap="square" /></svg>
              </span>
            </a>
          </div>
        </div>

        {/* ============ FEATURED FILM (single, auto-advancing) ============ */}
        <div className="relative z-10 bg-ink/95">
          <div className="container py-16" id="projects-grid">
            <div className="cardTilt relative w-[80vw] max-w-6xl mx-auto text-white">
              <div className="flex items-center gap-4 lg:gap-6">
                <button
                  onClick={goPrev}
                  aria-label="Previous film"
                  className="shrink-0 w-11 h-11 rounded-full border border-white/20 hover:bg-brand hover:text-ink hover:border-brand flex items-center justify-center transition-colors"
                >
                  <svg width="8" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
                    <path d="M0.350098 0.349976H6.7501V6.74998" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                  </svg>
                </button>
                <div className="overflow-hidden rounded-md relative flex-1">
                  <div className="aspect-video">
                    <video
                      key={FILMS[activeFilm].slug}
                      src={`/media/videos/${FILMS[activeFilm].slug}.mp4`}
                      poster={`/media/images/posters/${FILMS[activeFilm].slug}.jpg`}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                      preload="metadata"
                      onEnded={goNext}
                    />
                  </div>
                </div>
                <button
                  onClick={goNext}
                  aria-label="Next film"
                  className="shrink-0 w-11 h-11 rounded-full border border-white/20 hover:bg-brand hover:text-ink hover:border-brand flex items-center justify-center transition-colors"
                >
                  <svg width="8" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.350098 0.349976H6.7501V6.74998" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="flex flex-col gap-2">
                  <h3 className="uppercase text-base text-brand">{FILMS[activeFilm].title}</h3>
                  <p className="text-sm opacity-60">2025</p>
                </div>
                <div className="flex gap-2">
                  {FILMS.map((f, i) => (
                    <button
                      key={f.slug}
                      onClick={() => setActiveFilm(i)}
                      aria-label={`Show ${f.title}`}
                      className={`w-2 h-2 rounded-full transition-colors ${i === activeFilm ? "bg-brand" : "bg-white/20"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ============ UPLOAD / COMMUNITY ============ */}
          <section className="container py-16" id="upload">
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <h2 className="uppercase text-base text-brand">Upload</h2>
              </div>
              <div className="lg:col-span-8">
                <h2 className="font-display text-3xl lg:text-5xl font-medium text-brand">Share Your<br />Short Film</h2>
                <div className="h-10 lg:h-16"></div>
              </div>
            </div>
            <div className="w-full">
              <div className="border-t border-white/10 flex flex-col" data-hover-image-list="">
                {[
                  ["Upload Your File", "Direct upload or link"],
                  ["Add the Details", "Title, genre, credits"],
                  ["Choose a License", "CC-BY / All Rights Reserved"],
                  ["Publish", "Live on Loupe in minutes"],
                  ["Report & Takedown", "DMCA-compliant review"],
                ].map(([name, type]) => (
                  <a
                    href="#"
                    key={name}
                    className="relative overflow-hidden ps-4 grow flex group border-b border-white/10 py-6 lg:py-8 transition-all duration-150 hover:grow-[6]"
                  >
                    <div className="absolute inset-0 bg-brand scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-[850ms] ease-out" />
                    <div className="relative z-10 grid grid-cols-12 items-center w-full text-white group-hover:text-black transition-colors duration-[850ms]">
                      <div className="col-span-7 lg:col-span-8 group-hover:scale-110 origin-left transition-transform duration-200 ease-out uppercase text-lg lg:text-2xl">{name}</div>
                      <div className="col-span-3 lg:col-span-2 ps-5 opacity-60 text-sm lg:text-base">{type}</div>
                      <div className="col-span-2 place-items-center">
                        <svg className="group-hover:rotate-45 transition-transform duration-300" width="10" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.350098 0.349976H6.7501V6.74998" stroke="currentColor" strokeWidth="1" strokeLinecap="square" /></svg>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="h-10 lg:h-16"></div>
              <a href="#" className="btn">
                <span className="w-full px-5 py-3 rounded-full bg-brand text-ink flex gap-8 justify-between items-center">
                  <strong>Start Uploading</strong>
                  <svg width="8" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.350098 0.349976H6.7501V6.74998" stroke="currentColor" strokeWidth="1" strokeLinecap="square" /></svg>
                </span>
              </a>
            </div>
          </section>

          {/* ============ CTA (pinned logo zoom + stacked trail) ============ */}
          <div className="min-h-[220vh] overflow-clip" id="scale-section">
            <div className="flex items-center justify-center h-screen sticky top-0 pointer-events-none text-brand" id="logo-zoom-wrap">
              <span id="logo-zoom" className="font-display font-medium tracking-tight" style={{ fontSize: "12vw" }}>
                Loupe
              </span>
            </div>

            <div className="h-screen sticky top-0 flex justify-center items-center" id="cta-section">
              <div className="stacked-image-trail" data-stacked-trail-area=""></div>
              <div className="text-center relative z-10 container">
                <p className="font-display text-3xl lg:text-5xl font-medium max-w-[22ch] mx-auto mb-10" data-split-words="" id="cta-heading">
                  Every short film starts with someone hitting <strong>upload</strong> — yours could be <strong>next</strong>.
                </p>
                <a href="#contact" className="btn" id="cta-btn">
                  <span className="w-full px-5 py-3 rounded-full bg-white text-ink flex gap-8 justify-between items-center">
                    <strong>Contact</strong>
                    <svg width="8" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.350098 0.349976H6.7501V6.74998" stroke="currentColor" strokeWidth="1" strokeLinecap="square" /></svg>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <footer className="relative flex justify-center items-end text-white bg-ink pt-24" id="footer-section">
          <span className="noise opacity-[0.03]"></span>
          <canvas id="footer-canvas" className="pointer-events-none absolute inset-0 w-full h-full"></canvas>
          <div className="w-full container relative z-10 pb-8">
            <div className="grid grid-cols-12 gap-6 gap-y-10">
              <div className="col-span-12 lg:col-span-6 mt-16 flex items-center gap-3">
                <svg className="w-[40px] h-[40px] text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="42" cy="42" r="30" stroke="currentColor" strokeWidth="8" />
                  <line x1="64" y1="64" x2="92" y2="92" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                </svg>
                <span className="font-display font-medium text-2xl tracking-tight">Loupe</span>
              </div>
              <div className="col-span-12 lg:col-span-6">
                <div className="font-display text-3xl max-w-[14ch]"><span className="opacity-60">Short films.</span> Shared with the world.</div>
              </div>

              <div className="col-span-6 lg:col-span-2">
                <div className="mb-4 opacity-60 uppercase text-sm">Watch</div>
                <ul className="flex flex-col gap-2 text-sm">
                  <li><a href="#discover" className="link-underline">Trending Shorts</a></li>
                  <li><a href="#discover" className="link-underline">Categories</a></li>
                  <li><a href="#discover" className="link-underline">New Creators</a></li>
                </ul>
              </div>
              <div className="col-span-6 lg:col-span-2">
                <div className="mb-4 opacity-60 uppercase text-sm">Quick Links</div>
                <ul className="flex flex-col gap-2 text-sm">
                  <li><a href="#discover" className="link-underline">Discover</a></li>
                  <li><a href="#upload" className="link-underline">Upload</a></li>
                  <li><a href="#" className="link-underline">About</a></li>
                  <li><a href="#" className="link-underline">Careers</a></li>
                  <li><a href="#contact" className="link-underline">Contact</a></li>
                </ul>
              </div>
              <div className="col-span-6 lg:col-span-2">
                <div className="mb-4 opacity-60 uppercase text-sm">Contact</div>
                <div className="text-sm">123 Placeholder St.<br />Anytown, CA 00000</div>
                <ul className="flex flex-col gap-2 mt-4 text-sm">
                  <li><a href="mailto:hello@example.com" className="link-underline">hello@example.com</a></li>
                  <li><a href="tel:+10000000000" className="link-underline">(000)-000-0000</a></li>
                </ul>
              </div>
              <div className="col-span-6 lg:col-span-2">
                <div className="mb-4 opacity-60 uppercase text-sm">Social</div>
                <ul className="grid grid-cols-3 gap-4">
                  <li>
                    <a href="#" className="link-social" aria-label="Instagram">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="link-social" aria-label="Facebook">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M15.5 8.5H13.5C13.2239 8.5 13 8.72386 13 9V11H15.5L15.1 13.5H13V21H10V13.5H8V11H10V8.75C10 6.67893 11.6789 5 13.75 5H15.5V8.5Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="link-social" aria-label="TikTok">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M16 3C16.3 5.1 17.6 6.6 20 6.9V9.9C18.5 9.9 17.2 9.4 16 8.6V15.2C16 18.4 13.4 21 10.2 21C7 21 4.4 18.4 4.4 15.2C4.4 12 7 9.4 10.2 9.4C10.5 9.4 10.8 9.42 11.1 9.47V12.6C10.8 12.5 10.5 12.45 10.2 12.45C8.65 12.45 7.4 13.7 7.4 15.2C7.4 16.75 8.65 18 10.2 18C11.75 18 13 16.75 13 15.2V3H16Z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="link-social" aria-label="YouTube">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="5.5" width="20" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M10.5 9.5L15 12L10.5 14.5V9.5Z" fill="currentColor" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="link-social" aria-label="LinkedIn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="7.2" cy="7.5" r="1.3" fill="currentColor" />
                        <path d="M7.2 10.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <path
                          d="M11 17V13.5C11 12.1 11.9 11 13.2 11C14.5 11 15.3 12.1 15.3 13.5V17"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M11 12V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>

              <div className="col-span-12 pt-6">
                <hr className="opacity-20 mb-4" />
                <div className="flex justify-between text-sm">
                  <div className="opacity-50">© 2026 LOUPE — a home for short films</div>
                  <div className="flex gap-6">
                    <a href="#" className="link-underline">Privacy Policy</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const GetToKnowMe = ({ onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const slides = [
    {
      id: 'intro',
      title: 'Introduction',
      imageUrl: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663440/front_i5fh0m.jpg',
      narrative:
        "Hi I'm Great, and yes I have officially GRADUADA (siri said it's Spanish for graduated) and I am officially an Engineer (against my will) so, you MUST call me Engr. Great. my favorite food is beans and literally any other combination except corn and seafood. My favorite color is sparkle blue. I'm a pop and R&B music lover... Favorite artists are unlimited, but a few are Ain't Afraid, Zinnydmore, D'lait, Efue, Jazzworld (amapiano will not be the end of me IJN), Sia, Gaise Baba, AEO, BOYFROMEDEN, and plenty others. I am an award-winning Web Designer and developer, DevOps engineer, entrepreneur, builder and songwriter (just on random Thursdays). I am obsessed with anime and ice cream.",
    },
    {
      id: '100lvl',
      title: '100 LVL',
      imageUrl: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663438/100lvl_oelgon.jpg',
      narrative:
        "I never wanted to come here in the first place. Was I forced? ehhnnn something like that. But, I didn't really have a choice cause I wasn't the one paying the school fees. So far university has been a blur. I was super stressed out, super out of touch with humanity (cause my school is in the bush), and most importantly, I was fainting emotionally and mentally almost every 2 hours. Nothing really memorable in 100lvl, cause. I was literally the most boring individual. Oh I met Davidson in 100lvl and yeah that part was cool.",
    },
    {
      id: '200lvl',
      title: '200 LVL',
      imageUrl: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663433/200lvl_litb9v.jpg',
      narrative:
        "I began questioning my entire life choices here, not that I wasn't already questioning them, but I questioned them loudly. I remember reading for an exam and I was literally crying asking myself who sent me. Same story, blur... To love or to be seen? Omo to not do engineering. NEVER AGAIN (in Anthony kani's voice). Oh this was the season Seyi and I became friends. (Worth it like maddd).",
    },
    {
      id: '300lvl',
      title: '300 LVL',
      imageUrl: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663438/300lvl_za9cuj.jpg',
      narrative:
        "I began to loathe every single thing that existed within that entire obinze axis not that I wasn't already loathing everything before this moment, but I began to loathe it loudly. In this season, I ate more egg rolls, and ate more noodles. Oh and did I mention that since I entered that school till now, I haven't tried meshai? I sha think I took more pics. In this season, John Paul and I became oddly close (yazzzzz).",
    },
    {
      id: '400lvl',
      title: '400 LVL',
      imageUrl: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663434/400lvl_awe5jh.jpg',
      narrative:
        "This season pushed me beyond measure in a good way. I tried new things, I pitched, I built startups and apps, and digital projects and I failed a lot. And I also added weight, I was very inconsistent with working out, and traveled on my own. Did IT, met cool Yoruba people, my spark was now shining. But even though! I began to detest the idea of the course I was studying. Not that I hadn't detested it since, I just began to detest it loudly.",
    },
    {
      id: '500lvl',
      title: '500 LVL',
      imageUrl: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663441/500lvl_mczsix.jpg',
      narrative:
        "The story sha long. Became so unmotivated, coded more, worked away my social life, began my career in DevOps, participated in 3 hackathons, won none. Had a full circle moment and realized that I actually have amazing people in my circle... Exams killed me 26 different times, became extremely grateful yet super anxious cause I have really bad anxiety. Became more opinionated. And that's the gist for now sha.",
    },
  ];

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (slideId) => {
    setImageErrors(prev => ({
      ...prev,
      [slideId]: true
    }));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevSlide();
      if (e.key === 'ArrowRight') handleNextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const Placeholder = () => (
    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-slate-100 flex items-center justify-center">
      <div className="text-center text-slate-400">
        <div className="text-sm font-medium">Image Unavailable</div>
      </div>
    </div>
  );

  const currentSlideData = slides[currentSlide];

  return (
    <div className="h-screen overflow-hidden relative bg-[#fdfbf7]">
      {/* Carousel Container */}
      <div className="relative w-full h-full">
        {/* Slides */}
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Desktop: Split-Screen Layout */}
              <div className="hidden md:flex h-full w-full">
                {/* Image Side */}
                <div className="w-1/2 h-full flex items-center justify-center p-8 md:p-12 lg:p-16">
                  <div className="relative w-full h-full max-w-md rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {!imageErrors[slide.id] ? (
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        onError={() => handleImageError(slide.id)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Placeholder />
                    )}
                  </div>
                </div>

                {/* Text Side */}
                <div className="w-1/2 h-full flex items-center justify-center p-8 md:p-12 lg:p-16">
                  <div className="max-w-md space-y-8">
                    <div className="space-y-4">
                      <span className="block text-xs font-medium tracking-widest text-slate-500 uppercase">
                        Chapter {index + 1} of {slides.length}
                      </span>
                      <h1
                        className="text-5xl md:text-6xl font-serif font-bold text-slate-900 leading-tight"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {slide.title}
                      </h1>
                    </div>
                    <p className="text-base md:text-lg text-neutral-800 leading-relaxed font-light">
                      {slide.narrative}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Stacked Layout */}
              <div className="md:hidden h-full w-full flex flex-col overflow-y-auto">
                {/* Image */}
                <div className="w-full flex-shrink-0 h-1/2 bg-slate-100 overflow-hidden">
                  {!imageErrors[slide.id] ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      onError={() => handleImageError(slide.id)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Placeholder />
                  )}
                </div>

                {/* Text */}
                <div className="w-full flex-shrink-0 h-1/2 flex items-center justify-center p-6">
                  <div className="space-y-6 max-w-sm">
                    <div className="space-y-3">
                      <span className="block text-xs font-medium tracking-widest text-slate-500 uppercase">
                        Chapter {index + 1} of {slides.length}
                      </span>
                      <h1
                        className="text-4xl font-serif font-bold text-slate-900 leading-tight"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {slide.title}
                      </h1>
                    </div>
                    <p className="text-sm text-neutral-800 leading-relaxed font-light">
                      {slide.narrative}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrevSlide}
        aria-label="Previous slide"
        className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-30 group"
      >
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-300 group-hover:bg-white/40 group-hover:border-white/50">
          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-slate-700 transition-transform group-hover:-translate-x-0.5" />
        </div>
      </button>

      <button
        onClick={handleNextSlide}
        aria-label="Next slide"
        className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-30 group"
      >
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-300 group-hover:bg-white/40 group-hover:border-white/50">
          <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-slate-700 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 h-1 bg-slate-900'
                : 'w-2 h-1 bg-slate-400 hover:bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="absolute top-6 md:top-8 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-8 pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium transition-colors duration-200 group text-sm md:text-base"
        >
          <span>Back to Home</span>
        </button>

        <a
          href="https://webdesignking.online"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium transition-colors duration-200 group text-sm md:text-base"
        >
          <span>See My Portfolio</span>
        </a>
      </div>
    </div>
  );
};

export default GetToKnowMe;
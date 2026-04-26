"use client";

import { ReactNode, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/carousel";
import { TextRoll } from "./text-roll";
import Autoplay from "embla-carousel-autoplay";

export const AnimatedCarousel = ({
  title = "Trusted by thousands of businesses worldwide",
  logoCount = 15,
  autoPlay = true,
  autoPlayInterval = 2000,
  logos = null as (string | ReactNode)[] | null,
  containerClassName = "",
  titleClassName = "",
  carouselClassName = "",
  logoClassName = "",
  itemsPerViewMobile = 3,
  itemsPerViewDesktop = 5,
  spacing = "gap-10",
  padding = "py-20 lg:py-40",
  logoContainerWidth = "w-48",
  logoContainerHeight = "h-24",
  logoImageWidth = "w-full",
  logoImageHeight = "h-full",
  logoMaxWidth = "",
  logoMaxHeight = "",
}) => {
  const [api, setApi] = useState<CarouselApi>();

  const logoItems = logos || Array.from({ length: logoCount }, (_, i) => `https://th.bing.com/th/id/R.4aa108082e7d3cbd55add79f84612aaa?rik=I4dbPhSe%2fbHHSg&riu=http%3a%2f%2fpurepng.com%2fpublic%2fuploads%2flarge%2fpurepng.com-google-logo-2015brandlogobrand-logoiconssymbolslogosgoogle-6815229372333mqrr.png&ehk=ewmaCOvP0Ji4QViEJnxSdlrYUrTSTWhi8nZ9XdyCgAI%3d&risl=&pid=ImgRaw&r=0100x100?text=Logo+${i + 1}`);

  const logoImageSizeClasses = `${logoImageWidth} ${logoImageHeight} ${logoMaxWidth} ${logoMaxHeight}`.trim();

  // Tailwind does not support dynamic string interpolation for classes.
  // We must map them directly or use inline styles.
  const mobileBasis = itemsPerViewMobile === 3 ? 'basis-1/3' : itemsPerViewMobile === 2 ? 'basis-1/2' : 'basis-1/4';
  const desktopBasis = itemsPerViewDesktop === 5 ? 'lg:basis-1/5' : itemsPerViewDesktop === 6 ? 'lg:basis-1/6' : 'lg:basis-1/4';

  return (
    <div className={`w-full ${padding} bg-background ${containerClassName}`}>
      <div className="container mx-auto">
        <div className={`flex flex-col ${spacing}`}>
          <h2 className={`text-xl md:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-regular text-left ml-2 text-foreground ${titleClassName}`}>
            <TextRoll>{title}</TextRoll>
          </h2>

          <div>
            <Carousel
              setApi={setApi}
              opts={{ loop: true, align: "start" }}
              plugins={autoPlay ? [Autoplay({ delay: autoPlayInterval })] : []}
              className={`w-full ${carouselClassName}`}
            >
              <CarouselContent>
                {logoItems.map((logo, index) => {
                  const isString = typeof logo === 'string';
                  const isSvgString = isString && (logo as string).trim().startsWith('<svg');
                  return (
                    <CarouselItem className={`${mobileBasis} ${desktopBasis}`} key={index}>
                      <div className={`flex rounded-md ${logoContainerWidth} ${logoContainerHeight} items-center justify-center p-4 hover:bg-white/5 transition-colors ${logoClassName}`}>
                        {isSvgString ? (
                          <div
                            className={`${logoImageSizeClasses} flex items-center justify-center [&>svg]:w-full [&>svg]:h-full`}
                            dangerouslySetInnerHTML={{ __html: logo as string }}
                          />
                        ) : isString ? (
                          <img
                            src={logo as string}
                            alt={`Logo ${index + 1}`}
                            className={`${logoImageSizeClasses} object-contain`}
                          />
                        ) : (
                          <div className={`${logoImageSizeClasses} flex items-center justify-center [&>svg]:w-full [&>svg]:h-full`}>
                            {logo as ReactNode}
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
};

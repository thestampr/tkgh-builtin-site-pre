"use client";

import Image from "next/image";

interface Props {
  locale: string;
}

export function FooterHero({ locale }: Props) {
  const year = new Date().getFullYear();
  
  return (
    <footer>
      <section className="relative h-screen text-white">
        {/* hero image to extend behind NavBar */}
        <div className="absolute inset-0 overflow-hidden -z-1">
          <Image
            src="/images/footer.jpg"
            alt="Footer Hero"
            className="object-cover bg-top"
            fill
          />
          <div className="absolute inset-0 bg-black" style={{ opacity: 0.2 }} />
        </div>

        <div className="h-full flex flex-col justify-between p-8 md:p-16 lg:px-18 xl:px-26">
          <div>
            <h1 className="text-3xl font-semibold mb-6">Visit us</h1>
            {/* <p className="font-semibold">{config["corp"]}</p>
            <p className="max-w-md">
              {config["address"]}
            </p> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mt-8">
            <div className="flex flex-col space-y-2">
              <a href="#" className="uppercase font-semibold hover:underline">Our Projects</a>
              <a href="#" className="uppercase font-semibold hover:underline">About Us</a>
              <a href="#" className="uppercase font-semibold hover:underline">News & Promotions</a>
              <a href="#" className="uppercase font-semibold hover:underline">Blog</a>
            </div>
            <hr className="md:hidden opacity-20" />
            <div className="flex flex-col space-y-2">
              <a href="#" className="uppercase font-semibold hover:underline">Contact</a>
              <a href="#" className="uppercase font-semibold hover:underline">Work With Us</a>
            </div>
            <div className="flex flex-col space-y-4">
              <form className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                <input type="email" placeholder="Email address *" className="bg-transparent border-b border-white focus:outline-none text-white placeholder-gray-300 flex-1 py-2" />
                <button type="submit" className="uppercase font-semibold mt-3 sm:mt-0">Submit</button>
              </form>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between text-sm mt-12">
            <p>©{year} {process.env.NEXT_PUBLIC_BRAND}</p>
            <a href={`/${locale}/policy`} className="hover:underline">Policy</a>
          </div>
        </div>
      </section>
    </footer>
  );
}
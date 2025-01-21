import Image from 'next/image';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Video */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden -z-10">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center gap-8 pt-32 md:pt-36 px-4">
        <div className="w-[900px] max-w-[95vw] relative">
          <Image
            src="/we-are-back.png"
            alt="We are so $BACK"
            width={1800}
            height={900}
            priority
            className="w-full h-auto"
          />
        </div>
        <div className="text-center text-black tracking-wider">
          <h1 className="text-[36px] md:text-[72px] leading-tight font-bold mb-4 md:mb-8">
            IT&apos;S SEND EVERYTHING SEASON.
          </h1>
          <h2 className="text-[36px] md:text-[72px] leading-tight font-bold mb-8 md:mb-16">
            BUY $BACK.
          </h2>
          <div className="text-[24px] md:text-[48px] leading-tight font-normal space-y-2 md:space-y-4">
            <p>NO KOLS.</p>
            <p>NO CABALS.</p>
            <p>NO BUNDLES.</p>
            <p>NO BULLSHIT.</p>
            <p>UP ONLY.</p>
            <p>IT&apos;S THE BULL MARKET -</p>
            <p>FUCKING SEND IT.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Home;


import { useEffect } from 'react';
import { MdSearch } from 'react-icons/md';

const CommandPalette = () => {
  useEffect(() => {
    console.log('🚀 ~ CommandPalette ~ useEffect: 🎉🎉');
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center fixed top-0 left-0">
      {/* backdrop*/}
      <div className="w-screen h-screen bg-brand-darkBg/30 z-10  fixed top-0 left-0"></div>

      {/* search box */}
      <div className="w-[10rem] h=[2rem] bg-brand-darkBgAccent rounded-full flex items-center justify-start absolute top-[40%] left-auto z-20">
        <input className="text-2xl font-light tracking-wide w-[80%]" />
        <MdSearch className="fill-brand-darkBg/70" />
      </div>
    </div>
  );
};

export default CommandPalette;

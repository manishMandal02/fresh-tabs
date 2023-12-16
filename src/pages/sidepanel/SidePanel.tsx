import { useState, useEffect } from 'react';
import { ThemeColor, ISpace } from '../types/global.types';
import { MdArrowForwardIos, MdDelete } from 'react-icons/md';

const testSpace: ISpace[] = [
  {
    id: '1',
    theme: ThemeColor.pink,
    title: 'Work',
    emoji: '👨‍💻',
    tabs: [
      {
        id: '1',

        url: 'https://dev.to/jmfayard/github-actions-a-new-hope-in-yaml-wasteland-1i9c',
        faviconURI: 'https://dev.to/favicon.ico',
      },
      {
        id: '2',

        url: 'https://www.daily.co/blog/implementing-api-billing-with-stripe',
        faviconURI: 'https://www.daily.co/favicon.ico',
      },
      {
        id: '3',

        url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
        faviconURI: 'https://www.w3schools.com/favicon.ico',
      },
      {
        id: '4',

        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Favicon',
        faviconURI: 'https://developer.mozilla.org/favicon.ico',
      },
      {
        id: '5',

        url: 'https://www.daily.co/blog/implementing-api-billing-with-stripe',
        faviconURI: 'https://www.daily.co/favicon.ico',
      },
      {
        id: '5.5',

        url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
        faviconURI: 'https://www.w3schools.com/favicon.ico',
      },
      {
        id: '6',

        url: 'https://dev.to/jmfayard/github-actions-a-new-hope-in-yaml-wasteland-1i9c',
        faviconURI: 'https://dev.to/favicon.ico',
      },
    ],
  },
  {
    id: '2',
    theme: ThemeColor.green,
    title: 'Play',
    emoji: '🎮',
    tabs: [
      {
        id: '1',
        url: 'https://dev.to/jmfayard/github-actions-a-new-hope-in-yaml-wasteland-1i9c',
        faviconURI: 'https://dev.to/favicon.ico',
      },
      {
        id: '2',

        url: 'https://www.daily.co/blog/implementing-api-billing-with-stripe',
        faviconURI: 'https://www.daily.co/favicon.ico',
      },
      {
        id: '3',

        url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
        faviconURI: 'https://www.w3schools.com/favicon.ico',
      },
      {
        id: '4',

        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Favicon',
        faviconURI: 'https://developer.mozilla.org/favicon.ico',
      },
      {
        id: '5',

        url: 'https://www.daily.co/blog/implementing-api-billing-with-stripe',
        faviconURI: 'https://www.daily.co/favicon.ico',
      },
      {
        id: '6',
        url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
        faviconURI: 'https://www.w3schools.com/favicon.ico',
      },
      {
        id: '7',
        url: 'https://dev.to/jmfayard/github-actions-a-new-hope-in-yaml-wasteland-1i9c',
        faviconURI: 'https://dev.to/favicon.ico',
      },
    ],
  },
  {
    id: '3',
    theme: ThemeColor.orange,
    title: 'Side Projects',
    emoji: '🎨',
    tabs: [
      {
        id: '1',
        url: 'https://dev.to/jmfayard/github-actions-a-new-hope-in-yaml-wasteland-1i9c',
        faviconURI: 'https://dev.to/favicon.ico',
      },
      {
        id: '2',
        url: 'https://www.daily.co/blog/implementing-api-billing-with-stripe',
        faviconURI: 'https://www.daily.co/favicon.ico',
      },
      {
        id: '3',
        url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
        faviconURI: 'https://www.w3schools.com/favicon.ico',
      },
      {
        id: '4',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Favicon',
        faviconURI: 'https://developer.mozilla.org/favicon.ico',
      },
      {
        id: '5',
        url: 'https://www.daily.co/blog/implementing-api-billing-with-stripe',
        faviconURI: 'https://www.daily.co/favicon.ico',
      },
      {
        id: '6',
        url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
        faviconURI: 'https://www.w3schools.com/favicon.ico',
      },
      {
        id: '7',
        url: 'https://dev.to/jmfayard/github-actions-a-new-hope-in-yaml-wasteland-1i9c',
        faviconURI: 'https://dev.to/favicon.ico',
      },
      {
        id: '8',
        url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
        faviconURI: 'https://www.w3schools.com/favicon.ico',
      },
    ],
  },
];

const SidePanel = () => {
  const [spaces, setSpaces] = useState<ISpace[] | undefined>(undefined);

  // open space
  const [openedSpace, setOpenedSpace] = useState<ISpace | undefined>(undefined);

  useEffect(() => {
    setSpaces(testSpace);
  }, []);

  const handleOpenedSpace = (space: ISpace) => {
    const newOpenedSpace = openedSpace && openedSpace.id === space.id ? undefined : space || undefined;

    console.log('🚀 ~ file: SidePanel.tsx:42 ~ handleOpenedSpace ~ newOpenedSpace:', newOpenedSpace);

    setOpenedSpace(newOpenedSpace);
  };

  // check if space is opened
  const isSpaceOpened = (space: ISpace) => {
    return (openedSpace && openedSpace.id === space.id) || false;
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-brand-background">
      <main className="px-2.5">
        {/* heading */}
        <p className="text-slate-300 text-base  text-center mt-1">Fresh Tabs</p>

        {/* spaces */}
        <div className="mt-8 w-full">
          <p className="text-sm text-slate-500  mb-1.5 tracking-wide select-none">Spaces</p>
          {/* <hr className="bg-slate-800 border-none h-px w-full mb-2 my-1" /> */}
          {/* un saved  */}
          {spaces?.map(space => (
            <div
              key={space.title}
              className={`text-slate-100 relative w-full  flex items-center justify-start 
           select-none transition-all duration-200  mb-2.5 bg-slate-800   rounded-md border-b`}
              style={{
                // boxShadow: `0 0.2px 1px 0px ${space.theme}`,
                borderColor: space.theme,
                borderLeftWidth: isSpaceOpened(space) ? '1px' : '0px',
                borderRightWidth: isSpaceOpened(space) ? '1px' : '0px',
                height: isSpaceOpened(space) ? '16rem' : '3rem',
              }}>
              {/* space info container */}
              <button
                className="py-3 px-3 w-full h-[40px] flex items-center justify-between absolute top-0  border-slate-700"
                onClick={() => handleOpenedSpace(space)}
                style={{ borderBottomWidth: isSpaceOpened(space) ? '1px' : '0px' }}>
                {/* title container */}
                <div className="flex items-center gap-x-1">
                  <p className="text-base font-medium text-slate-50">{space.emoji}</p>
                  <p className="text-sm font-medium text-slate-50">{space.title}</p>
                </div>
                {/* right-end container */}
                <div className="flex items-center">
                  <span className="text-[.8rem] mr-2.5 opacity-80">{12}</span>
                  {/* <SlOptionsVertical className="text-slate-300 text-sm cursor-pointer" /> */}
                  <MdArrowForwardIos className="text-slate-300 text-xs  rotate-90 cursor-pointer" />
                </div>
              </button>
              {/* tabs within opened space */}
              {isSpaceOpened(space) ? (
                <div className="absolute mt-4 top-[20px] h-[calc(100%-40px)] overflow-x-hidden overflow-y-auto w-full scroll-m-1 scroll-p-0">
                  {space.tabs.map(tab => (
                    <div
                      className=" w-full px-2.5 py-2 flex items-center justify-between border-b border-slate-600"
                      key={tab.id}>
                      <span className="flex items-center">
                        <img className="w-4 h-4 mr-2 rounded-full" src={tab.faviconURI} alt="icon" />
                        <span className="text-xs text-slate-400 w-[14rem] whitespace-nowrap overflow-hidden text-ellipsis">
                          {tab.url}
                        </span>
                      </span>
                      <span>
                        <MdDelete className="text-slate-300 text-xs cursor-pointer" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SidePanel;

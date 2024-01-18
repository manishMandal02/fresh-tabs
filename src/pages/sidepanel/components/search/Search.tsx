import { useState, useRef, FormEvent, useEffect, useCallback, KeyboardEvent } from 'react';
import { MdArrowForwardIos, MdSearch, MdOutlineClose } from 'react-icons/md';
import { ITab } from '@root/src/pages/types/global.types';
import { appSettingsAtom, spacesAtom } from '@root/src/stores/app';
import { useAtom } from 'jotai';
import { Tab } from '../space';
import Switch from '../elements/switch/Switch';
import { wait } from '@root/src/pages/utils';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';

type SearchResult = {
  space: string;
  tabs: Pick<ITab, 'title' | 'url'>[];
};

const Search = () => {
  // global state
  const [spaces] = useAtom(spacesAtom);
  const [appSettings] = useAtom(appSettingsAtom);

  // local state
  const [searchQuery, setSearchQuery] = useState('');

  const [shouldShowBMResults, setShouldShowBMResults] = useState(true);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearch = useCallback(
    async (ev?: FormEvent) => {
      ev?.preventDefault();

      setSearchResults([]);

      // search tabs in the current space
      const results: SearchResult[] = [];

      for (const space of spaces) {
        const tabsInSpace = await getTabsInSpace(space.id);

        const tabs = tabsInSpace?.filter(
          tab =>
            tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tab.url.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        if (tabs?.length < 1) continue;

        results.push({
          space: `${space.emoji} ${space.title}`,
          tabs: [...tabs.map(t => ({ title: t.title, url: t.url }))],
        });
      }

      // search bookmark if enabled
      if (shouldShowBMResults) {
        let bookmarksTabs = await chrome.bookmarks.search({ query: searchQuery });

        bookmarksTabs = bookmarksTabs.filter(b => !!b.url);

        if (bookmarksTabs?.length > 0) {
          results.push({
            space: '🏷️ Bookmarks',
            tabs: [...bookmarksTabs.map(bm => ({ title: bm.title, url: bm.url }))],
          });
        }
      }
      setSearchResults(results);
    },
    [searchQuery, shouldShowBMResults, spaces],
  );

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, shouldShowBMResults, handleSearch]);

  useEffect(() => {
    setShouldShowBMResults(appSettings.includeBookmarksInSearch);
  }, [appSettings]);

  const inputRef = useRef<HTMLInputElement>(undefined);

  const handleIconClick = () => {
    // focus input on icon click
    inputRef.current.focus();
  };

  const handleSwitchChange = async (value: boolean) => {
    setShouldShowBMResults(value);
  };

  const handleKeydown = ev => {
    const key = (ev as KeyboardEvent).key;

    console.log('🚀 ~ handleKeydown ~ key:', key);

    if (key === 'f') {
      inputRef.current.focus();
      // hack to clear search as f gets added after the input is focused
      (async () => {
        await wait(10);
        setSearchQuery(prev => (prev.trim() === 'f' ? '' : prev));
      })();
    } else if (key.toLowerCase() === 'escape') {
      console.log('🚀 ~ handleKeydown ~ key:', key);

      setSearchQuery('');
      inputRef.current.blur();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);

    () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  //  clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="mt-6 mb-2 mx-8">
      <form
        onSubmit={handleSearch}
        className="flex items-center text-slate-200 font-light px-2 py-1.5  rounded-lg   border border-slate-700/60  focus-within:shadow focus-within:shadow-teal-400">
        <MdSearch className="opacity-25 scale-125 mt-px" onClick={handleIconClick} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tabs..."
          className="placeholder:text-slate-500 placeholder:select-none outline-none bg-transparent ml-1.5 w-full   "
          value={searchQuery}
          onChange={ev => setSearchQuery(ev.currentTarget.value)}
        />
        {searchQuery?.length > 2 ? (
          <MdOutlineClose className="opacity-50 scale-150 cursor-pointer" onClick={handleClearSearch} />
        ) : null}
      </form>
      {/* search results */}
      {searchResults?.length > 0 ? (
        <div
          className={`fixed max-h-[75%] mt-2 left-1/2 -translate-x-1/2 z-50 bg-gray-800
          rounded-md px-3 pb-1 pt-2 w-[95%]  shadow-md shadow-teal-500 overflow-y-auto scroll-smooth cc-scrollbar`}>
          <p className="text-slate-400 text-[12.5px] font-light  text-center">
            {searchResults.length} search results for {searchQuery || 'manish'}
          </p>
          <div className="flex items-center text-slate-500 text-xs font-light mt-1 w-fit mb-3 mx-auto">
            <label htmlFor="include-bm-result" className="mr-2">
              Include bookmarks results
            </label>
            <Switch id="include-bm-result" size="small" checked={shouldShowBMResults} onChange={handleSwitchChange} />
          </div>

          {searchResults.map(({ space, tabs }, idx) => (
            <div key={space} className="mb-3 border-l-2 border-slate-700 rounded-sm ">
              <div className="text-xs text-slate-400 opacity-90 bg-gray-900/30 border-b flex items-center justify-between border-slate-600/70 mb-1 py-1.5 px-2.5 rounded-tr-md ">
                {space}
                <MdArrowForwardIos className={`text-slate-500 text-xs rotate-90`} />
              </div>
              {/* <hr className="mt-1 mb-1.5 opacity-15  w-[50%]" /> */}
              {tabs.map(tab => (
                <Tab
                  key={tab.url}
                  tabData={{ ...tab, id: idx }}
                  isTabActive={false}
                  isSpaceActive={false}
                  showDeleteOption={false}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Search;

import { useState, useRef, FormEvent, useEffect, useCallback , KeyboardEvent } from 'react';
import { MdArrowForwardIos, MdSearch } from 'react-icons/md';
import { ITab } from '@root/src/pages/types/global.types';
import { appSettingsAtom, spacesAtom } from '@root/src/stores/app';
import { useAtom } from 'jotai';
import { Tab } from '../space';
import Switch from '../elements/switch/Switch';
import { wait } from '@root/src/pages/utils';

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

  const [shouldShowBMResults, setShouldShowBMResults] = useState(false);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearch = useCallback(
    async (ev?: FormEvent) => {
      ev && ev.preventDefault();

      setSearchResults([]);

      // search tabs in the current space
      const results: SearchResult[] = [];

      for (const space of spaces) {
        const tabs = space.tabs.filter(tab => tab.title.toLowerCase().includes(searchQuery.toLowerCase()));

        if (tabs.length < 1) continue;

        results.push({
          space: `${space.emoji} ${space.title}`,
          tabs: [...tabs.map(t => ({ title: t.title, url: t.url }))],
        });
      }

      // search bookmark if enabled
      if (shouldShowBMResults) {
        let bookmarksTabs = await chrome.bookmarks.search({ query: searchQuery });

        bookmarksTabs = bookmarksTabs.filter(b => !!b.url);

        if (bookmarksTabs.length > 0) {
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
    console.log('🚀 ~ file: Search.tsx:60 ~ useEffect ~ searchQuery:', searchQuery);
    if (searchQuery.length > 3) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, shouldShowBMResults, handleSearch]);

  useEffect(() => {
    setShouldShowBMResults(appSettings.includeBookmarksInSearch);

    // todo - testing
    // setSearchQuery('manish');
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
    if (key === 'f') {
      inputRef.current.focus();
      // hack to clear search as f gets added after the input is focused
      (async () => {
        await wait(10);
        setSearchQuery(prev => (prev.trim() === 'f' ? '' : prev));
      })();
    } else if (key === 'Escape') {
      setSearchQuery('');
      inputRef.current.blur();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);

    () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className="mt-6 mb-2 mx-8">
      <form
        onSubmit={handleSearch}
        className="flex items-center text-slate-200 font-light px-2 py-1.5  rounded-md   border border-slate-700/60  focus-within:shadow focus-within:shadow-teal-400">
        <MdSearch className="opacity-25 scale-125" onClick={handleIconClick} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tabs..."
          className="placeholder:text-slate-500 outline-none bg-transparent ml-1.5 w-full   "
          value={searchQuery}
          onChange={ev => setSearchQuery(ev.currentTarget.value)}
        />
      </form>
      {/* search results */}
      {searchResults.length > 0 ? (
        <div className="fixed top-[16%] left-1/2 -translate-x-1/2 z-50 bg-slate-900 rounded-sm px-3 py-3 w-[95%] shadow-lg shadow-gray-900/80 overflow-y-auto">
          <p className="text-slate-400 text-xs font-light  text-center">
            {searchResults.length} search results for {searchQuery || 'manish'}
          </p>
          <div className="flex items-center text-slate-500 text-xs font-light my-2 w-fit mb-3 mx-auto">
            <label htmlFor="include-bm-result" className="mr-2">
              include bookmark results
            </label>
            <Switch id="include-bm-result" size="small" checked={shouldShowBMResults} onChange={handleSwitchChange} />
          </div>

          {searchResults.map(({ space, tabs }, idx) => (
            <div key={space} className="mt-2">
              <div>
                <p className="text-xs text-slate-300 font-light ml-1">{space}</p>
                <MdArrowForwardIos />
              </div>
              <hr className="my-1.5 opacity-15  w-[50%]" />
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

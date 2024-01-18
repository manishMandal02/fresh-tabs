import { getFaviconURL } from '@root/src/pages/utils';
import React from 'react';
import Tooltip from '../../elements/tooltip';

type Props = {
  title?: string;
  url: string;
};

const FavTab = ({ title, url }: Props) => {
  return (
    <Tooltip label={title || url} delay={1000}>
      <div className="bg-brand-darkBgAccent/70 w-[28px] h-[28px] rounded-md flex items-center justify-center">
        <img className="w-[16px] h-[16px] rounded-sm cursor-pointer" src={getFaviconURL(url)} alt="icon" />
      </div>
    </Tooltip>
  );
};

export default FavTab;

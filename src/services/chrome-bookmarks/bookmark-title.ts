import { ThemeColor } from '@root/src/constants/app';
import { ISpace } from '@root/src/types/global.types';

// create bookmark title from space details
export const generateBMTitle = (space: ISpace) =>
  `${space.emoji}-${space.title}-${space.id}-${space.theme}-${space.activeTabIndex}-${space.windowId}`;

// get space details from bookmark title
export const getSpaceInfoFromBMTitle = (title: string): ISpace => {
  const spaceDetailsParts = title.split('-');

  const spaceDetails: ISpace = {
    emoji: spaceDetailsParts[0],
    title: spaceDetailsParts[1],
    id: spaceDetailsParts[2],
    theme: spaceDetailsParts[3] as ThemeColor,
    activeTabIndex: Number(spaceDetailsParts[4]),
    windowId: Number(spaceDetailsParts[5]),
    isSaved: true,
  };

  return spaceDetails;
};

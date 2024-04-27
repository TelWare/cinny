import { style } from '@vanilla-extract/css';
import { color } from 'folds';

export const RoomAvatar = style({
  backgroundColor: color.Secondary.Main,
  color: color.Secondary.OnMain,
  textTransform: 'capitalize',

  selectors: {
    '&[data-image-loaded="true"]': {
      backgroundColor: 'transparent',
    },
  },
});
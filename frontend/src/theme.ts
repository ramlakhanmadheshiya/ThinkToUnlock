export const colors = {
  background: '#F5F1E8',
  surface: '#FFFFFF',
  primary: '#E04D36',
  primaryDark: '#C93C27',
  black: '#0A0A0A',
  yellow: '#FDE047',
  mint: '#A3E635',
  blue: '#60A5FA',
  pink: '#F9A8D4',
  disabled: '#D1D5DB',
  textMuted: '#525252',
};

export const shadow = {
  // brutalist hard shadow used via View style with shadow props on iOS, elevation on android, fallback solid offset rectangle on web
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
};

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
};

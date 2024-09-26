import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

import { useReduxStateSelector } from './useReduxStateSelector';

// The useColorScheme value is always either light or dark, but the built-in
// type suggests that it can be null. This will not happen in practice, so this
// makes it a bit easier to work with.

// The default app color scheme will combine with user input color scheme to
// return the final color scheme

export default function useColorScheme(): NonNullable<ColorSchemeName> {
  const colorScheme = _useColorScheme();
  const customColorScheme = useReduxStateSelector((s) => s.setting?.colorScheme);

  return (customColorScheme || colorScheme) as NonNullable<ColorSchemeName>;
}

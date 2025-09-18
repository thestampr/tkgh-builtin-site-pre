import 'server-only'
import localFont from 'next/font/local'

const pathToFont = '../../../public';

export const Legitima = localFont({ 
  src: [
    {
      path: `${pathToFont}/fonts/legitima/Legitima-Italic.woff2`
    },
    {
      path: `${pathToFont}/fonts/legitima/Legitima-Regular.woff2`
    }
  ]
});
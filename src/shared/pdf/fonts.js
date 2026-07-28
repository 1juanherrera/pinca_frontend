import { Font } from '@react-pdf/renderer';
import OutfitRegular from '../../assets/fonts/Outfit-Regular.ttf';
import OutfitBold from '../../assets/fonts/Outfit-Bold.ttf';

// Tipografía de marca (Outfit) — registro único para TODAS las plantillas
// PDF (DocPdf, DocTicket, comprobantes específicos). Importar este módulo
// por su efecto secundario alcanza: `import '../../shared/pdf/fonts'`.
Font.register({
  family: 'Outfit',
  fonts: [
    { src: OutfitRegular, fontWeight: 400 },
    { src: OutfitBold, fontWeight: 700 },
  ],
});

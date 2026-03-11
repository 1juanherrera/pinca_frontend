import { formatLetterDate } from "../utils/formatters";
import { getDateTheme } from "../utils/services";


const DateBadge = ({ date }) => {
  const theme = getDateTheme(date);
  const formattedDate = formatLetterDate(date); // La función del paso anterior

  return (
    <div className={`block text-center justify-center shadow-md items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold uppercase ${theme.classes}`}>
      {/* Opcional: un punto de color para resaltar */}
      <span className={`w-1.5 h-1.5 rounded-full ${theme.punto}`} />
      {formattedDate}
    </div>
  );
};

export default DateBadge
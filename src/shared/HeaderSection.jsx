import { ChevronRight } from "lucide-react";

const HeaderSection = ({ title, subtitle, description, icon: Icon }) => {

    return (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-lg text-white shadow-lg shadow-zinc-900/20">
            {Icon && <Icon size={20} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight uppercase">{title}</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>{subtitle}</span>
                <ChevronRight size={10} />
              <span>{description}</span>
            </div>
          </div>
        </div>
    )
} 

export default HeaderSection;
import { TelescopeIcon } from "lucide-react";


const Header = () => {
    return(
        <div className="fixed top-4 left-4 flex items-center gap-2 cursor-pointer"
                onClick={() => window.location.href = "/"}>
                <TelescopeIcon className="bg-neutral-900 text-white p-2 rounded-md" size={32} />
                <span className="text-neutral-900 font-semibold text-lg">SmartAI</span>
            </div>
    )
}
export default Header;
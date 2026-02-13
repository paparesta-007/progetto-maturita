import AppContext from "../context/AppContext";
import AppLayout from "./AppLayout";

const ViewContent: React.FC = () => {
    return (
        <AppContext value={{ isSettingOpen: false, setIsSettingOpen: () => {}, toggleSetting: () => {} }}>
            <AppLayout />
        </AppContext>
    );
}
export default ViewContent;
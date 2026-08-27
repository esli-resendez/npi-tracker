import { Routes, Route } from 'react-router-dom';
import ActiveBuilds from './active_builds';
import CreateNew from './create_new';
import HistoricReport from './historic_reports';

export default function MainScreen(){
    return(
        <div>
        <main className="content">
        <Routes>
        <Route path="/active-builds" element={<ActiveBuilds />} />
        <Route path="/create-new" element={<CreateNew />} />
        <Route path="/historic-report" element={<HistoricReport />}/>
        </Routes>
        </main>
        </div>
    );
}
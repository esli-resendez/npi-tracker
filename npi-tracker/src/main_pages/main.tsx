import { Routes, Route } from 'react-router-dom';
import ActiveBuilds from './active_builds';
import CreateNew from './create_new';
import HistoricReport from './historic_reports';
import TestBenchPage from './test_bench';

export default function MainScreen(){
    return(
        <div>
        <main className="content">
        <Routes>
        <Route path="/active-builds" element={<ActiveBuilds />} />
        <Route path="/create-new" element={<CreateNew />} />
        <Route path="/historic-report" element={<HistoricReport />}/>
        {/* Temporary, unlinked -- simulates an external system's process-event
            POST. Remove this route (and test_bench.tsx) once real external
            systems are wired up. */}
        <Route path="/test-bench" element={<TestBenchPage />} />
        </Routes>
        </main>
        </div>
    );
}
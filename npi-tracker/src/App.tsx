import './styles/App.css';
import { FluentProvider } from '@fluentui/react-components';
import Banner from './components/Banner';
import NavBar from './components/Navbar';
import Footer from './components/Footer';
import MainScreen from './main_pages/main';

function App() {
  return (
    <FluentProvider className="app-container">

      {/* Banner */}
      <Banner/>
      {/* Navigation */}
      <NavBar/>

      {/* Main Content */}
      <MainScreen/>

      {/* Footer */}
      <Footer/>

    </FluentProvider>
  );
}

export default App;

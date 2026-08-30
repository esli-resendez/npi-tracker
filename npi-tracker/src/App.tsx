import './styles/App.css';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import Banner from './components/Banner';
import NavBar from './components/Navbar';
import Footer from './components/Footer';
import MainScreen from './main_pages/main';

function App() {
  return (
    <FluentProvider id='fprovider-main' className="app-container" theme={webLightTheme}>

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

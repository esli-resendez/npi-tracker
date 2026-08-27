import './styles/App.css';
import Banner from './components/Banner';
import NavBar from './components/Navbar';
import Footer from './components/Footer';
import MainScreen from './main_pages/main';

function App() {
  return (
    <div className="app-container">

      {/* Banner */}
      <Banner/>
      {/* Navigation */}
      <NavBar/>

      {/* Main Content */}
      <MainScreen/>

      {/* Footer */}
      <Footer/>

    </div>
  );
}

export default App;

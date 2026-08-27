import { Button } from '@fluentui/react-components';
import '../styles/App.css';
import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
      <nav className="navbar">
        <NavLink to="/"><Button>Home</Button></NavLink>
        <NavLink to="/active-builds"><Button>Active Builds</Button></NavLink>
        <NavLink to="/create-new"><Button>Create New</Button></NavLink>
        <NavLink to="/historic-report"><Button>Historic Report</Button></NavLink>
      </nav>
  );
}      
      

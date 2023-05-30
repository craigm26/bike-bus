import React from 'react';
import { useHistory } from 'react-router-dom';

const Navigation: React.FC = () => {
  const history = useHistory();

  const navigateTo = (path: string) => {
    history.push(path);
  };

  return (
    <div>
      <button onClick={() => navigateTo('/createRoute')}>Create Route</button>
      {/* add more buttons for other paths as needed */}
    </div>
  );
};

export default Navigation;

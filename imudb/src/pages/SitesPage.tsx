import React, { useEffect } from 'react';

const SitesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Sites Page';
  }, []);

  return <h1>Sites Page</h1>;
};

export default SitesPage;
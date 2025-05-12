import React, { ReactNode } from 'react';
import '../../styles/PageLayout.css';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * A consistent page layout component for use across all content pages
 * to ensure unified styling throughout the application.
 */
const PageLayout: React.FC<PageLayoutProps> = ({ title, children, actions }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{title}</h1>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageLayout; 
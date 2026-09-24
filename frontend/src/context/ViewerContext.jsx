import React, { createContext, useContext, useState } from 'react';

const ViewerContext = createContext();

export const VIEWERS = {
  MINISTRY: {
    id: 'ministry',
    label: 'Ministry Oversight',
    badgeColor: 'bg-secondary text-on-secondary',
    defaultRoute: '/ministry/overview',
    subtitle: 'Government of India — Ministry Oversight'
  },
  DISTRICT: {
    id: 'district',
    label: 'District Authority — Varanasi',
    badgeColor: 'bg-primary text-on-primary',
    defaultRoute: '/district/overview',
    subtitle: 'District Collector Terminal — Varanasi (UP)'
  },
  MP: {
    id: 'mp',
    label: 'MP — Shri Narendra Modi',
    badgeColor: 'bg-neutral-800 text-white',
    defaultRoute: '/mp/dashboard',
    subtitle: 'Member of Parliament Portal — Varanasi'
  }
};

export const ViewerProvider = ({ children }) => {
  const [activeRole, setActiveRole] = useState('ministry');
  const [district, setDistrict] = useState('Varanasi');
  const [mpName, setMpName] = useState('Shri Narendra Modi');

  const currentViewer = VIEWERS[activeRole.toUpperCase()] || VIEWERS.MINISTRY;

  const switchRole = (roleKey) => {
    if (VIEWERS[roleKey.toUpperCase()]) {
      setActiveRole(roleKey.toLowerCase());
    }
  };

  return (
    <ViewerContext.Provider
      value={{
        activeRole,
        switchRole,
        currentViewer,
        district,
        setDistrict,
        mpName,
        setMpName,
        VIEWERS
      }}
    >
      {children}
    </ViewerContext.Provider>
  );
};

export const useViewer = () => {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  return context;
};

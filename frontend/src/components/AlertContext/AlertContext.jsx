import React from 'react';

const AlertContext = React.createContext();

export const AlertProvider = AlertContext.Provider;
export const AlertConsumer = AlertContext.Consumer;

export default AlertContext;
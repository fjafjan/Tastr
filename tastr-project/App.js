import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import VotePage from './VotePage';
import LoginPage from './LoginPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="" element={<HomePage />} />
        <Route path="/:sessionId" element={<LoginPage />} />
        <Route path="/:sessionId/voting" element={<VotePage />} />
      </Routes>
    </Router>
  );
};

export default App;

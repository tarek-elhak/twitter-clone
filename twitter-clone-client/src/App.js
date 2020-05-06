import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
// pages
import home from "./pages/home";
import login from "./pages/login";
import signup from "./pages/signup";
// components
import Navbar from "./components/Navbar";
function App() {
  return (
    <div className="App">
      <Router>
        <Navbar />
        <div className="container">
          <switch>
            <Route exact path="/" component={home} />
            <Route exact path="/login" component={login} />
            <Route exact path="/signup" component={signup} />
          </switch>
        </div>
      </Router>
    </div>
  );
}

export default App;

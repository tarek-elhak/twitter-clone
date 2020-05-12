import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
// redux
import { Provider } from "react-redux";
import store from "./redux/store";
import jwtDecode from "jwt-decode";
// util
import themeFile from "./util/theme";
import AuthRoute from "./util/AuthRoute";
// pages
import home from "./pages/home";
import login from "./pages/login";
import signup from "./pages/signup";
// components
import Navbar from "./components/Navbar";
// creating a theme
const theme = createMuiTheme(themeFile);

const token = localStorage.FBIdToken;
let authenticated;
if (token) {
  const decodedToken = jwtDecode(token);
  if (decodedToken.exp * 1000 < Date.now()) {
    window.location.href("/login");
    authenticated = false;
  } else {
    authenticated = true;
  }
}
function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <Provider store={store}>
        <Router>
          <Navbar />
          <div className="container">
            <Switch>
              <Route exact path="/" component={home} />
              <AuthRoute
                exact
                path="/login"
                component={login}
                authenticated={authenticated}
              />
              <AuthRoute
                exact
                path="/signup"
                component={signup}
                authenticated={authenticated}
              />
            </Switch>
          </div>
        </Router>
      </Provider>
    </MuiThemeProvider>
  );
}

export default App;
